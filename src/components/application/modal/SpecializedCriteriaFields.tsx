import React from "react";
import { Info } from "lucide-react";
import { Input } from "../../forms/Input";

export interface SpecializedCriteriaFieldsProps {
  reqId: string;
  handleFieldChange: (setter: (v: any) => void, val: any) => void;
  setTitle?: (v: string) => void;
  levelOrDuration?: string;
  setLevelOrDuration?: (v: string) => void;
  conductEvalType: "numeric" | "special_institution";
  setConductEvalType: (v: "numeric" | "special_institution") => void;
  conductScore: string;
  setConductScore: (v: string) => void;
  conductSpecialRank: string;
  setConductSpecialRank: (v: string) => void;
  partyStatus: string;
  setPartyStatus: (v: string) => void;
  partyAdmissionDate: string;
  setPartyAdmissionDate: (v: string) => void;
  trainingLevel: "university" | "college";
  setTrainingLevel: (v: "university" | "college") => void;
  gpaScale: "4" | "10";
  setGpaScale: (v: "4" | "10") => void;
  gpaScore: string;
  setGpaScore: (v: string) => void;
  gpaCredits: string;
  setGpaCredits: (v: string) => void;
  academicAwardRank: string;
  setAcademicAwardRank: (v: string) => void;
  journalIssn: string;
  setJournalIssn: (v: string) => void;
  creativeProductType: "patent" | "license" | "award";
  setCreativeProductType: (v: "patent" | "license" | "award") => void;
  fitnessTitleType: "thanh_nien_khoe" | "sinh_vien_khoe";
  setFitnessTitleType: (v: "thanh_nien_khoe" | "sinh_vien_khoe") => void;
  sportDiscipline: string;
  setSportDiscipline: (v: string) => void;
  sportPrizeRank: string;
  setSportPrizeRank: (v: string) => void;
  volActivityType: string;
  setVolActivityType: (v: string) => void;
  volDaysCount: string;
  setVolDaysCount: (v: string) => void;
  bloodProgramName: string;
  setBloodProgramName: (v: string) => void;
  skillsContent: string;
  setSkillsContent: (v: string) => void;
  unionAwardLevel: string;
  setUnionAwardLevel: (v: string) => void;
  langPathway: "certificate" | "course_gpa";
  setLangPathway: (v: "certificate" | "course_gpa") => void;
  isLangMajor: boolean;
  setIsLangMajor: (v: boolean) => void;
  langMajorName: string;
  setLangMajorName: (v: string) => void;
  langMajorPrimary: string;
  setLangMajorPrimary: (v: string) => void;
  langMajorSecondary: string;
  setLangMajorSecondary: (v: string) => void;
  langCertType: string;
  setLangCertType: (v: string) => void;
  langCertScore: string;
  setLangCertScore: (v: string) => void;
  langCourseGpa: string;
  setLangCourseGpa: (v: string) => void;
  intlActivityType: string;
  setIntlActivityType: (v: string) => void;
  contestPrizeRank: string;
  setContestPrizeRank: (v: string) => void;
  organizer?: string;
  setOrganizer?: (v: string) => void;
}

export const SpecializedCriteriaFields: React.FC<SpecializedCriteriaFieldsProps> = (props) => {
  const {
    reqId,
    handleFieldChange,
    setTitle = () => {},
    levelOrDuration = '',
    setLevelOrDuration = () => {},
    conductEvalType,
    setConductEvalType,
    conductScore,
    setConductScore,
    conductSpecialRank,
    setConductSpecialRank,
    partyStatus,
    setPartyStatus,
    partyAdmissionDate,
    setPartyAdmissionDate,
    trainingLevel,
    setTrainingLevel,
    gpaScale,
    setGpaScale,
    gpaScore,
    setGpaScore,
    gpaCredits,
    setGpaCredits,
    academicAwardRank,
    setAcademicAwardRank,
    journalIssn,
    setJournalIssn,
    creativeProductType,
    setCreativeProductType,
    fitnessTitleType,
    setFitnessTitleType,
    sportDiscipline,
    setSportDiscipline,
    sportPrizeRank,
    setSportPrizeRank,
    volActivityType,
    setVolActivityType,
    volDaysCount,
    setVolDaysCount,
    bloodProgramName,
    setBloodProgramName,
    skillsContent,
    setSkillsContent,
    unionAwardLevel,
    setUnionAwardLevel,
    langPathway,
    setLangPathway,
    isLangMajor,
    setIsLangMajor,
    langMajorName,
    setLangMajorName,
    langMajorPrimary,
    setLangMajorPrimary,
    langMajorSecondary,
    setLangMajorSecondary,
    langCertType,
    setLangCertType,
    langCertScore,
    setLangCertScore,
    langCourseGpa,
    setLangCourseGpa,
    intlActivityType,
    setIntlActivityType,
    contestPrizeRank,
    setContestPrizeRank,
    organizer = '',
    setOrganizer = () => {},
  } = props;

  return (
    <>
          {reqId === 'ethics-score' && (
            <div className="space-y-4 p-4 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[12px]">
              <div>
                <label className="block text-[12.5px] font-semibold text-[#172A3A] mb-1.5">
                  Hình thức đánh giá điểm rèn luyện
                </label>
                <div className="flex items-center gap-4 text-[13px]">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[#172A3A]">
                    <input
                      type="radio"
                      name="conductEvalType"
                      checked={conductEvalType === 'numeric'}
                      onChange={() => handleFieldChange(setConductEvalType, 'numeric')}
                      className="text-[#18A6E0]"
                    />
                    <span>Thang điểm 100 thông thường (Đạt từ 80/100 trở lên)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[#172A3A]">
                    <input
                      type="radio"
                      name="conductEvalType"
                      checked={conductEvalType === 'special_institution'}
                      onChange={() => handleFieldChange(setConductEvalType, 'special_institution')}
                      className="text-[#18A6E0]"
                    />
                    <span>Cơ sở đào tạo đặc thù (Quy đổi xếp loại Giỏi)</span>
                  </label>
                </div>
              </div>

              {conductEvalType === 'numeric' ? (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Điểm rèn luyện cả năm học 2025–2026"
                    value={conductScore}
                    onChange={(e) => handleFieldChange(setConductScore, e.target.value)}
                    placeholder="Ví dụ: 85 (tối thiểu 80/100 điểm)"
                    type="number"
                    min="0"
                    max="100"
                    required
                  />
                  <div>
                    <label className="block text-[12.5px] font-semibold text-[#172A3A] mb-1">
                      Xếp loại rèn luyện
                    </label>
                    <div className="p-2.5 bg-white border border-[#DCE7EE] rounded-[8px] text-[13px] font-semibold text-[#1B7C49]">
                      {parseInt(conductScore) >= 90 ? 'Xuất sắc (>= 90 điểm)' : parseInt(conductScore) >= 80 ? 'Tốt (>= 80 điểm) · Đạt chuẩn' : 'Chưa đạt chuẩn (dưới 80 điểm)'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12.5px] font-semibold text-[#172A3A] mb-1">
                      Xếp loại rèn luyện quy đổi
                    </label>
                    <select
                      value={conductSpecialRank}
                      onChange={(e) => handleFieldChange(setConductSpecialRank, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#DCE7EE] rounded-[8px] text-[13px] font-medium"
                    >
                      <option value="Giỏi">Loại Giỏi (Đạt chuẩn quy định)</option>
                      <option value="Xuất sắc">Loại Xuất sắc (Đạt chuẩn quy định)</option>
                    </select>
                  </div>
                  <Input
                    label="Tên cơ sở đào tạo đặc thù"
                    value={organizer}
                    onChange={(e) => handleFieldChange(setOrganizer, e.target.value)}
                    placeholder="Ví dụ: Học viện / Trường đặc thù"
                  />
                </div>
              )}
            </div>
          )}

          {/* 2. Điểm GPA (TC2.1) */}
          {reqId === 'academic-gpa' && (
            <div className="space-y-4 p-4 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[12px]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-semibold text-[#172A3A] mb-1">
                    Bậc đào tạo của sinh viên
                  </label>
                  <select
                    value={trainingLevel}
                    onChange={(e) => handleFieldChange(setTrainingLevel, e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-[#DCE7EE] rounded-[8px] text-[13px] font-medium"
                  >
                    <option value="university">Đại học / Học viện (Ngưỡng: từ 3.2/4 hoặc từ 8.0/10 trở lên)</option>
                    <option value="college">Cao đẳng (Ngưỡng: từ 3.0/4 hoặc từ 7.5/10 trở lên)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12.5px] font-semibold text-[#172A3A] mb-1">
                    Thang điểm áp dụng
                  </label>
                  <select
                    value={gpaScale}
                    onChange={(e) => handleFieldChange(setGpaScale, e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-[#DCE7EE] rounded-[8px] text-[13px] font-medium"
                  >
                    <option value="4">Thang điểm 4 (Hệ đào tạo tín chỉ)</option>
                    <option value="10">Thang điểm 10 (Hệ đào tạo niên chế)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={`Điểm trung bình chung năm học 2025–2026 (GPA ${gpaScale === '4' ? '/ 4.00' : '/ 10.0'})`}
                  value={gpaScore}
                  onChange={(e) => handleFieldChange(setGpaScore, e.target.value)}
                  placeholder={gpaScale === '4' ? 'Ví dụ: 3.45' : 'Ví dụ: 8.2'}
                  type="number"
                  min="0"
                  max={gpaScale === '4' ? '4' : '10'}
                  step="0.01"
                  required
                />
                <Input
                  label="Tổng số tín chỉ hoàn thành trong năm học"
                  value={gpaCredits}
                  onChange={(e) => handleFieldChange(setGpaCredits, e.target.value)}
                  placeholder="Ví dụ: 38 tín chỉ"
                />
              </div>

              <div className="p-3 bg-[#FEF9EE] border border-[#FADDB6] rounded-[8px] text-[12px] text-[#8C3A19] flex items-center gap-2">
                <Info size={14} className="text-[#D97706] shrink-0" />
                <span>
                  Lưu ý: Hệ thống yêu cầu kê khai GPA của riêng năm học xét chọn 2025–2026, không lấy GPA tích lũy toàn khóa.
                </span>
              </div>
            </div>
          )}

          {/* 3. Hoạt động tình nguyện & Hiến máu (TC4.1) */}
          {reqId === 'volunteer-activities' && (
            <div className="space-y-4 p-4 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[12px]">
              <div>
                <label className="block text-[12.5px] font-semibold text-[#172A3A] mb-1.5">
                  Loại hình hoạt động tình nguyện
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12.5px]">
                  <label className="flex items-center gap-2 p-2 bg-white border border-[#DCE7EE] rounded-[8px] cursor-pointer">
                    <input
                      type="radio"
                      name="volType"
                      checked={volActivityType === 'campaign'}
                      onChange={() => {
                        handleFieldChange(setVolActivityType, 'campaign');
                        setTitle('Chiến dịch tình nguyện Mùa hè xanh 2026');
                      }}
                      className="text-[#18A6E0]"
                    />
                    <span>Chiến dịch tình nguyện (Mùa hè xanh, Tiếp sức mùa thi...)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white border border-[#DCE7EE] rounded-[8px] cursor-pointer">
                    <input
                      type="radio"
                      name="volType"
                      checked={volActivityType === 'blood_donation'}
                      onChange={() => {
                        handleFieldChange(setVolActivityType, 'blood_donation');
                        setTitle('Hiến máu tình nguyện đợt 1 năm học 2025–2026');
                      }}
                      className="text-[#18A6E0]"
                    />
                    <span className="font-bold text-[#DC2626]">Hiến máu tình nguyện (Quy đổi 01 ngày)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white border border-[#DCE7EE] rounded-[8px] cursor-pointer">
                    <input
                      type="radio"
                      name="volType"
                      checked={volActivityType === 'green_sunday'}
                      onChange={() => {
                        handleFieldChange(setVolActivityType, 'green_sunday');
                        setTitle('Hoạt động Ngày Chủ nhật xanh lần 2');
                      }}
                      className="text-[#18A6E0]"
                    />
                    <span>Ngày Chủ nhật xanh</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white border border-[#DCE7EE] rounded-[8px] cursor-pointer">
                    <input
                      type="radio"
                      name="volType"
                      checked={volActivityType === 'shelter'}
                      onChange={() => {
                        handleFieldChange(setVolActivityType, 'shelter');
                        setTitle('Hoạt động tình nguyện tại Trung tâm Bảo trợ xã hội');
                      }}
                      className="text-[#18A6E0]"
                    />
                    <span>Cơ sở bảo trợ xã hội / Mái ấm</span>
                  </label>
                </div>
              </div>

              {volActivityType === 'blood_donation' ? (
                <div className="space-y-3 p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[8px]">
                  <Input
                    label="Tên chương trình / đợt hiến máu"
                    value={bloodProgramName}
                    onChange={(e) => handleFieldChange(setBloodProgramName, e.target.value)}
                    placeholder="Ví dụ: Giọt hồng Đà Nẵng 2026"
                  />
                  <div className="flex items-center justify-between text-[12px] text-[#991B1B]">
                    <span>Số ngày tương đương quy đổi theo văn bản:</span>
                    <span className="font-bold px-2 py-0.5 bg-white rounded-[5px] border border-[#FECACA]">01 ngày tình nguyện</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Số ngày tham gia thực tế được xác nhận"
                    value={volDaysCount}
                    onChange={(e) => handleFieldChange(setVolDaysCount, e.target.value)}
                    placeholder="Ví dụ: 3 (ngày)"
                    type="number"
                    min="1"
                    required
                  />
                  <Input
                    label="Địa bàn / Địa điểm triển khai hoạt động"
                    value={levelOrDuration}
                    onChange={(e) => handleFieldChange(setLevelOrDuration, e.target.value)}
                    placeholder="Ví dụ: Xã Hòa Bắc, Huyện Hòa Vang"
                  />
                </div>
              )}
            </div>
          )}

          {/* 4. Ngoại ngữ (TC5.3) */}
          {reqId === 'integration-lang' && (
            <div className="space-y-4 p-4 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[12px]">
              <div>
                <label className="block text-[12.5px] font-semibold text-[#172A3A] mb-1.5">
                  Hình thức đáp ứng tiêu chuẩn ngoại ngữ
                </label>
                <div className="flex items-center gap-4 text-[13px]">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[#172A3A]">
                    <input
                      type="radio"
                      name="langPathway"
                      checked={langPathway === 'certificate'}
                      onChange={() => handleFieldChange(setLangPathway, 'certificate')}
                      className="text-[#18A6E0]"
                    />
                    <span>Chứng chỉ ngoại ngữ (IELTS, TOEIC, TOEFL, B1...)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[#172A3A]">
                    <input
                      type="radio"
                      name="langPathway"
                      checked={langPathway === 'course_gpa'}
                      onChange={() => handleFieldChange(setLangPathway, 'course_gpa')}
                      className="text-[#18A6E0]"
                    />
                    <span>Điểm trung bình các học phần ngoại ngữ tích lũy</span>
                  </label>
                </div>
              </div>

              {/* Chuyên ngành ngoại ngữ Checkbox */}
              <label className="flex items-center gap-2.5 p-2.5 bg-white border border-[#DCE7EE] rounded-[8px] cursor-pointer text-[12.5px] font-semibold text-[#172A3A]">
                <input
                  type="checkbox"
                  checked={isLangMajor}
                  onChange={(e) => handleFieldChange(setIsLangMajor, e.target.checked)}
                  className="rounded text-[#18A6E0]"
                />
                <span>Tôi là sinh viên chuyên ngành ngoại ngữ (Quy định: Áp dụng đối với Ngoại ngữ thứ hai)</span>
              </label>

              {isLangMajor && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-[#EAF6FC] border border-[#D0E8F5] rounded-[8px]">
                  <Input
                    label="Chuyên ngành đào tạo"
                    value={langMajorName}
                    onChange={(e) => handleFieldChange(setLangMajorName, e.target.value)}
                    placeholder="Ví dụ: Ngôn ngữ Anh"
                  />
                  <Input
                    label="Ngoại ngữ thứ hai áp dụng xét SV5T"
                    value={langMajorSecondary}
                    onChange={(e) => handleFieldChange(setLangMajorSecondary, e.target.value)}
                    placeholder="Ví dụ: Tiếng Pháp / Tiếng Trung / Tiếng Nhật"
                  />
                </div>
              )}

              {langPathway === 'certificate' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12.5px] font-semibold text-[#172A3A] mb-1">
                      Loại chứng chỉ ngoại ngữ
                    </label>
                    <select
                      value={langCertType}
                      onChange={(e) => handleFieldChange(setLangCertType, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#DCE7EE] rounded-[8px] text-[13px] font-medium"
                    >
                      <option value="IELTS">IELTS (Ngưỡng đạt: từ 4.5 trở lên)</option>
                      <option value="TOEIC">TOEIC (Ngưỡng đạt: từ 405 điểm trở lên)</option>
                      <option value="TOEFL iBT">TOEFL iBT (Ngưỡng đạt: từ 53 điểm trở lên)</option>
                      <option value="B1 / C">Trình độ C hoặc B1 Khung 6 bậc trở lên</option>
                      <option value="Khác">Chứng chỉ ngoại ngữ khác</option>
                    </select>
                  </div>
                  <Input
                    label="Điểm số / Trình độ đạt được"
                    value={langCertScore}
                    onChange={(e) => handleFieldChange(setLangCertScore, e.target.value)}
                    placeholder="Ví dụ: 6.5 (hoặc 650 điểm TOEIC)"
                    required
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Điểm TB các học phần ngoại ngữ tích lũy"
                    value={langCourseGpa}
                    onChange={(e) => handleFieldChange(setLangCourseGpa, e.target.value)}
                    placeholder="Ví dụ: 3.20 / 4.00 (Yêu cầu >= 3.0/4 hoặc >= 7.5/10)"
                    type="number"
                    step="0.01"
                    required
                  />
                  <Input
                    label="Đơn vị xác nhận bảng điểm học phần"
                    value={organizer}
                    onChange={(e) => handleFieldChange(setOrganizer, e.target.value)}
                    placeholder="Ví dụ: Phòng Đào tạo Trường"
                  />
                </div>
              )}
            </div>
          )}
    </>
  );
};
