/**
 * 5TOT UDN — Official Regulations & Award Criteria Guidance Modal
 * Đơn vị tổ chức: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 * Cổng xét chọn Danh hiệu và Giải thưởng Sinh viên Đại học Đà Nẵng
 */

import React, { useEffect } from 'react';
import {
  X,
  FileText,
  CheckCircle2,
  Building2,
  ClipboardCheck,
  ArrowRight,
  Info,
  Award,
  Users,
  Feather,
  ExternalLink,
} from 'lucide-react';
import { CRITERIA } from '../../../tokens';
import { UDN_PORTAL_CONFIG } from './udnLandingData';

export type GuidanceModalTab = 'sv5t' | 'collective' | 'white_bird' | 'guide';

export interface OfficialGuidanceModalProps {
  isOpen: boolean;
  activeTab: GuidanceModalTab;
  onTabChange: (tab: GuidanceModalTab) => void;
  onClose: () => void;
  onStartApplication: () => void;
  onNavigateToCollectiveLogin?: () => void;
}

const SV5T_CRITERIA_DETAILS = [
  {
    id: 'ethics',
    number: '01',
    name: 'Tiêu chí Đạo đức tốt',
    accentColor: CRITERIA.ethics.accentColor,
    mandatory: [
      'Điểm rèn luyện đạt từ 80 điểm trở lên (trên thang điểm 100 theo quy chế đánh giá kết quả rèn luyện của Bộ Giáo dục và Đào tạo, Bộ Lao động - Thương binh và Xã hội).',
      'Không vi phạm pháp luật và các quy chế, nội quy của nhà trường, quy định của địa phương và cộng đồng.',
    ],
    supplementary:
      'Tiêu chí ưu tiên xét: Là Đảng viên ĐCSVN; thành viên chính thức đội thi tìm hiểu chủ nghĩa Mác – Lênin, tư tưởng Hồ Chí Minh từ cấp trường trở lên; có tham luận, bài viết tại diễn đàn học thuật về các môn khoa học Mác – Lênin, tư tưởng Hồ Chí Minh; là thanh niên tiêu biểu, thanh niên tiên tiến, gương người tốt việc tốt, có hành động dũng cảm cứu người... được biểu dương từ cấp trường trở lên.',
  },
  {
    id: 'academic',
    number: '02',
    name: 'Tiêu chí Học tập tốt',
    accentColor: CRITERIA.academic.accentColor,
    mandatory: [
      'Điểm trung bình học tập trong năm học từ 3,2/4 trở lên.',
      'Đạt thêm 01 trong các tiêu chí: (1) Tham gia đề tài NCKH sinh viên (không áp dụng luận văn tốt nghiệp) từ cấp khoa trở lên; (2) Có luận văn, đồ án tốt nghiệp đạt điểm đánh giá từ 8,0 trở lên; (3) Có bài viết đăng trên tạp chí chuyên ngành; (4) Có bài tham luận in trong kỷ yếu hội thảo khoa học chuyên ngành từ cấp khoa trở lên; (5) Có sản phẩm sáng tạo được cấp bằng sáng chế, giấy phép xuất bản hoặc đạt giải thưởng từ cấp trường trở lên; (6) Là thành viên đội tuyển tham gia kỳ thi học thuật cấp trường trở lên; (7) Đạt giải thưởng cuộc thi NCKH, khởi nghiệp, ý tưởng sáng tạo từ cấp trường trở lên.',
    ],
    supplementary:
      'Tiêu chí ưu tiên xét: Thành viên đội tuyển dự thi cấp quốc gia, quốc tế; đội tuyển vào Vòng Chung kết cuộc thi học thuật cấp Trường trở lên; tham gia dự thi các cuộc thi học thuật của các Trường, ĐH trong thành phố, khu vực, công ty tổ chức và đạt giải.',
  },
  {
    id: 'physical',
    number: '03',
    name: 'Tiêu chí Thể lực tốt',
    accentColor: CRITERIA.physical.accentColor,
    mandatory: [
      'Đạt 01 trong các tiêu chuẩn: (1) Đạt danh hiệu “Thanh niên khỏe” hoặc “Sinh viên khỏe” (theo Hướng dẫn liên tịch số 87/2006/HDLT-ĐTN-TDTT ngày 24/11/2006); (2) Tham gia rèn luyện thể thao định kỳ tại 01 CLB, đội, nhóm TDTT trong nhà trường (ngoài nhà trường phải có xác nhận của đơn vị liên quan); (3) Là thành viên đội tuyển hoặc cá nhân tham gia thi đấu tại hội thao, giải TDTT các cấp; (4) Điểm giáo dục thể chất trong năm học đạt loại khá trở lên.',
    ],
    supplementary:
      'Tiêu chí ưu tiên xét: Là thành viên đội tuyển thể dục thể thao của trường tham gia thi đấu tại các giải cấp ĐHQG, cấp Thành, cấp quốc gia, quốc tế.',
  },
  {
    id: 'volunteer',
    number: '04',
    name: 'Tiêu chí Tình nguyện tốt',
    accentColor: CRITERIA.volunteer.accentColor,
    mandatory: [
      'Đạt 01 trong các tiêu chuẩn: (1) Có giấy chứng nhận tham gia chiến dịch tình nguyện Mùa hè xanh, Chiến dịch Xuân tình nguyện – Đông yêu thương, chương trình Tiếp sức mùa thi; (2) Tham gia ít nhất 03 ngày tình nguyện/năm (tính cộng dồn thực tế: ví dụ 01 ngày mái ấm, nhà mở + 01 lần hiến máu tình nguyện + 01 ngày Chủ nhật xanh); (3) Được giấy khen cấp trường trở lên về hoạt động tình nguyện.',
    ],
    supplementary:
      'Khuyến khích sinh viên tham gia tích cực nhiều chiến dịch, chương trình tình nguyện cộng đồng và hiến máu tình nguyện trong năm học.',
  },
  {
    id: 'integration',
    number: '05',
    name: 'Tiêu chí Hội nhập tốt',
    accentColor: CRITERIA.integration.accentColor,
    mandatory: [
      'Hoàn thành ít nhất 01 khóa trang bị kỹ năng thực hành xã hội hoặc được Hội Sinh viên, Đoàn Thanh niên từ cấp trường trở lên khen thưởng thành tích xuất sắc trong công tác Hội/Đoàn trong năm học; tham gia tích cực ít nhất 01 hoạt động về hội nhập do cấp khoa trở lên tổ chức.',
      'Đạt thêm 01 trong 03 tiêu chuẩn: (1) Chứng chỉ tiếng Anh trình độ B1 (khung tham chiếu châu Âu) hoặc tương đương B1 (quy đổi IELTS, TOEFL, TOEIC theo Thông tư 05/2012/TT/BGDĐT) hoặc tổng điểm các học phần ngoại ngữ tích lũy từ năm nhất tới thời điểm xét đạt từ 3,0/4 trở lên (SV chuyên ngành Ngoại ngữ áp dụng Ngoại ngữ 2); (2) Tham gia ít nhất 01 hoạt động giao lưu quốc tế (Hội nghị, Hội thảo quốc tế, gặp gỡ, giao lưu, hợp tác thanh niên, sinh viên quốc tế); (3) Tham gia và đạt giải Ba trở lên tại các cuộc thi về kiến thức hoặc có sử dụng Ngoại ngữ từ cấp khoa trở lên.',
    ],
    supplementary:
      'Tiêu chí ưu tiên xét: Đạt giải khuyến khích trở lên trong các cuộc thi tìm hiểu về văn hoá, lịch sử, xã hội trong nước và thế giới do cấp Liên Chi, CLB – Đội, Nhóm trở lên tổ chức.',
  },
];

export const OfficialGuidanceModal: React.FC<OfficialGuidanceModalProps> = ({
  isOpen,
  activeTab,
  onTabChange,
  onClose,
  onStartApplication,
  onNavigateToCollectiveLogin,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="official-guidance-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#0F2231]/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[880px] max-h-[90vh] bg-white rounded-2xl border border-[#CFE0EC] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Masthead */}
        <div className="px-6 py-4 bg-[#F5F9FC] border-b border-[#CFE0EC] flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#0B64A0]">
              ĐẠI HỌC ĐÀ NẴNG · HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG
            </div>
            <h2
              id="official-guidance-modal-title"
              className="text-[18px] sm:text-[19px] font-extrabold text-[#0E2538] mt-0.5"
            >
              Quy định tiêu chuẩn xét chọn (Quyết định số 12 QĐ/ĐHĐN-HSV & QĐ 1720/QĐ-HSV)
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ hướng dẫn"
            className="p-1.5 rounded-lg text-[#466474] hover:text-[#0E2538] hover:bg-[#E6EFF5] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Bar (4 Distinct Tabs) */}
        <div className="px-6 bg-white border-b border-[#DCE7EE] flex items-center gap-4 sm:gap-6 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => onTabChange('sv5t')}
            className={`py-3 text-[13px] sm:text-[13.5px] font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'sv5t'
                ? 'border-[#0B64A0] text-[#0B64A0]'
                : 'border-transparent text-[#526B7E] hover:text-[#0E2538]'
            }`}
          >
            <Award size={15} />
            <span>01. Sinh viên 5 tốt</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('collective')}
            className={`py-3 text-[13px] sm:text-[13.5px] font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'collective'
                ? 'border-[#0D9488] text-[#0D9488]'
                : 'border-transparent text-[#526B7E] hover:text-[#0E2538]'
            }`}
          >
            <Users size={15} />
            <span>02. Tập thể SV5T</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('white_bird')}
            className={`py-3 text-[13px] sm:text-[13.5px] font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'white_bird'
                ? 'border-[#D97706] text-[#D97706]'
                : 'border-transparent text-[#526B7E] hover:text-[#0E2538]'
            }`}
          >
            <Feather size={15} />
            <span>03. Giải thưởng Cánh chim trắng</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('guide')}
            className={`py-3 text-[13px] sm:text-[13.5px] font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'border-[#0B64A0] text-[#0B64A0]'
                : 'border-transparent text-[#526B7E] hover:text-[#0E2538]'
            }`}
          >
            <FileText size={15} />
            <span>04. Quy trình & Minh chứng</span>
          </button>
        </div>

        {/* Scrollable Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-[13.5px] text-[#2C4A5F]">
          {/* ========================================================================= */}
          {/* TAB 1: SINH VIÊN 5 TỐT                                                    */}
          {/* ========================================================================= */}
          {activeTab === 'sv5t' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#F0F7FD] border border-[#CDE3F3] flex items-start gap-3">
                <Info size={18} className="text-[#0B64A0] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-[#0E2538]">
                    Quyết định số 12 QĐ/ĐHĐN-HSV ngày 22/9/2022 của Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng:
                  </span>{' '}
                  Áp dụng đối với sinh viên đang theo học tại các cơ sở giáo dục thành viên và đơn vị trực thuộc Đại học Đà Nẵng; đạt danh hiệu “Sinh viên 5 tốt” cấp trường và được BTK Hội Sinh viên cấp trường, BTV Đoàn Thanh niên cấp trường (đối với đơn vị chưa có tổ chức Hội Sinh viên) đề nghị xét ở cấp Đại học Đà Nẵng. Thời gian tính thành tích từ <strong>01/8 năm trước tới 01/8 năm xét trao danh hiệu</strong>.
                </div>
              </div>

              <div className="space-y-3">
                {SV5T_CRITERIA_DETAILS.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-[#DCE7EE] bg-white overflow-hidden shadow-2xs"
                  >
                    <div className="px-4 py-2.5 bg-[#F8FBFD] border-b border-[#E6EFF5] flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: item.accentColor }}
                      />
                      <span
                        className="text-[12px] font-extrabold tabular-nums"
                        style={{ color: item.accentColor }}
                      />
                      <span
                        className="text-[12px] font-extrabold tabular-nums"
                        style={{ color: item.accentColor }}
                      >
                        {item.number}
                      </span>
                      <span className="text-[14px] font-extrabold text-[#0E2538]">
                        {item.name}
                      </span>
                    </div>

                    <div className="p-4 space-y-2.5">
                      <div>
                        <div className="text-[11.5px] font-bold uppercase tracking-wider text-[#526B7E] mb-1">
                          Tiêu chuẩn quy định:
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-[#0E2538]">
                          {item.mandatory.map((m, idx) => (
                            <li key={idx}>{m}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-1 text-[12.5px] text-[#526B7E]">
                        <span className="font-bold text-[#0E2538]">
                          Tiêu chí ưu tiên xét / Bổ trợ:{' '}
                        </span>
                        {item.supplementary}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: TẬP THỂ SINH VIÊN 5 TỐT                                            */}
          {/* ========================================================================= */}
          {activeTab === 'collective' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#F0FDF9] border border-[#CCFBF1] flex items-start gap-3">
                <Users size={18} className="text-[#0D9488] shrink-0 mt-0.5" />
                <div className="leading-relaxed text-[#115E59]">
                  <strong className="font-bold text-[#0F766E]">
                    Quy định xét chọn danh hiệu “Tập thể Sinh viên 5 tốt” cấp Đại học Đà Nẵng (Mục II, Quyết định số 12 QĐ/ĐHĐN-HSV):
                  </strong>{' '}
                  Đối tượng áp dụng là các Liên chi hội, chi hội; liên chi đoàn, chi đoàn (đối với các trường chưa có tổ chức Hội Sinh viên) thuộc các trường thành viên và đơn vị trực thuộc Đại học Đà Nẵng.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl border border-[#D5E6F2] bg-[#F9FCFE] space-y-2">
                  <div className="text-[12px] font-extrabold uppercase tracking-wider text-[#0D9488] flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>1. Công nhận cấp Trường & Đề cử ĐHĐN</span>
                  </div>
                  <p className="text-[#324B5E] text-[13px] leading-relaxed">
                    Đạt danh hiệu Tập thể Sinh viên 5 tốt cấp Trường và có ít nhất 01 sinh viên đạt danh hiệu “Sinh viên 5 tốt” cấp Đại học Đà Nẵng trong năm học xét chọn.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#D5E6F2] bg-[#F9FCFE] space-y-2">
                  <div className="text-[12px] font-extrabold uppercase tracking-wider text-[#0D9488] flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>2. 100% đăng ký tham gia phong trào</span>
                  </div>
                  <p className="text-[#324B5E] text-[13px] leading-relaxed">
                    100% sinh viên trong tập thể đăng ký tham gia phong trào “Sinh viên 5 tốt” tại đơn vị.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#D5E6F2] bg-[#F9FCFE] space-y-2">
                  <div className="text-[12px] font-extrabold uppercase tracking-wider text-[#0D9488] flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>3. Tỷ lệ đạt SV5T cấp Trường (&gt;= 30%)</span>
                  </div>
                  <p className="text-[#324B5E] text-[13px] leading-relaxed">
                    Ít nhất 30% sinh viên trong tập thể đạt danh hiệu “Sinh viên 5 tốt” cấp trường (đối với tiêu chuẩn xét cấp Đại học Đà Nẵng theo QĐ 12 QĐ/ĐHĐN-HSV).
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#D5E6F2] bg-[#F9FCFE] space-y-2">
                  <div className="text-[12px] font-extrabold uppercase tracking-wider text-[#0D9488] flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>4. Không có sinh viên vi phạm</span>
                  </div>
                  <p className="text-[#324B5E] text-[13px] leading-relaxed">
                    Không có sinh viên vi phạm pháp luật và các quy chế, nội quy của nhà trường, quy định của địa phương cư trú và cộng đồng.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#D5E6F2] space-y-2">
                <div className="font-bold text-[#0E2538] text-[13.5px]">
                  Hồ sơ đề nghị xét trao danh hiệu (Nộp trước ngày 30/10)
                </div>
                <p className="text-[#4A6377] text-[13px] leading-relaxed">
                  Đại diện Ban Chấp hành Liên chi hội / Chi hội / Liên chi đoàn / Chi đoàn đăng nhập qua <strong>Cổng Tập thể</strong>, kê khai báo cáo thành tích kèm minh chứng xác nhận cấp trường gửi về Hội Sinh viên Đại học Đà Nẵng chậm nhất ngày 30/10 năm xét danh hiệu.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: GIẢI THƯỞNG CÁNH CHIM TRẮNG                                        */}
          {/* ========================================================================= */}
          {activeTab === 'white_bird' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-3">
                <Feather size={20} className="text-[#D97706] shrink-0 mt-0.5" />
                <div className="leading-relaxed text-[#92400E]">
                  <strong className="font-bold">
                    Quy chế Giải thưởng Cánh chim trắng — Quyết định số 1720/QĐ-HSV:
                  </strong>{' '}
                  Giải thưởng truyền thống cao quý của Hội Sinh viên Việt Nam Đại học Đà Nẵng nhằm ghi nhận, tôn vinh các cá nhân, tập thể, mô hình và sáng kiến tiêu biểu trong học sinh, sinh viên Đại học Đà Nẵng.
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-[#FDE68A] bg-white space-y-1.5 shadow-2xs">
                  <div className="text-[13px] font-extrabold text-[#B45309] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                    <span>1. Cánh chim ươm mầm</span>
                  </div>
                  <p className="text-[#2C4A5F] text-[13px] leading-relaxed pl-4">
                    Trao cho các mô hình, công trình, giải pháp, phần mềm hoặc sáng kiến có tính sáng tạo cao, được áp dụng hiệu quả và mang lại chuyển biến tích cực trong công tác Hội và phong trào thanh niên, sinh viên Đại học Đà Nẵng.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#FDE68A] bg-white space-y-1.5 shadow-2xs">
                  <div className="text-[13px] font-extrabold text-[#B45309] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                    <span>2. Cánh chim truyền lửa</span>
                  </div>
                  <p className="text-[#2C4A5F] text-[13px] leading-relaxed pl-4">
                    Ghi nhận những cán bộ Hội, đoàn viên, sinh viên tiêu biểu có đóng góp nổi bật, bền bỉ và tận tâm với công tác Hội; có tinh thần truyền cảm hứng, dẫn dắt phong trào và tạo sức lan tỏa sâu rộng trong cộng đồng sinh viên.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#FDE68A] bg-white space-y-1.5 shadow-2xs">
                  <div className="text-[13px] font-extrabold text-[#B45309] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                    <span>3. Cánh chim sáng tạo</span>
                  </div>
                  <p className="text-[#2C4A5F] text-[13px] leading-relaxed pl-4">
                    Tôn vinh các đề tài nghiên cứu khoa học, dự án khởi nghiệp đổi mới sáng tạo, giải pháp công nghệ kỹ thuật của sinh viên đạt giải thưởng cao hoặc có giá trị ứng dụng thực tiễn giải quyết các vấn đề kinh tế - xã hội.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[12.5px] text-[#475569]">
                  Tham khảo toàn văn quy chế gốc tại Cổng thông tin Tuổi trẻ Đại học Đà Nẵng:
                </span>
                <a
                  href={UDN_PORTAL_CONFIG.officialRegulationsUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#D97706] text-white text-[12.5px] font-bold hover:bg-[#B45309] transition-colors shrink-0"
                >
                  <span>Xem văn bản QĐ 1720</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: QUY TRÌNH & MINH CHỨNG HỢP LỆ                                      */}
          {/* ========================================================================= */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl border border-[#D5E6F2] bg-[#F8FBFD] space-y-1.5">
                  <div className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-wider text-[#0B64A0]">
                    <Building2 size={16} />
                    <span>Bước 1 · Tài khoản theo mã SV</span>
                  </div>
                  <p className="text-[#2C4A5F] text-[13px] leading-relaxed">
                    Sinh viên đăng ký theo đúng trường thành viên hoặc đơn vị đào tạo trực thuộc Đại học Đà Nẵng, sử dụng mã số sinh viên chính xác.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#D5E6F2] bg-[#F8FBFD] space-y-1.5">
                  <div className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-wider text-[#0B64A0]">
                    <FileText size={16} />
                    <span>Bước 2 · Kê khai & đính kèm minh chứng</span>
                  </div>
                  <p className="text-[#2C4A5F] text-[13px] leading-relaxed">
                    Kê khai từng tiêu chuẩn và đính kèm tệp số hóa rõ nét (PDF, JPG, PNG). Tên tệp rõ ràng, dung lượng phù hợp.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#D5E6F2] bg-[#F8FBFD] space-y-1.5">
                  <div className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-wider text-[#0B64A0]">
                    <ClipboardCheck size={16} />
                    <span>Bước 3 · Thẩm định cấp Trường</span>
                  </div>
                  <p className="text-[#2C4A5F] text-[13px] leading-relaxed">
                    Hội Sinh viên các trường thành viên đối chiếu điểm học tập, điểm rèn luyện và lập danh sách đề nghị lên cấp Đại học Đà Nẵng.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#D5E6F2] bg-[#F8FBFD] space-y-1.5">
                  <div className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-wider text-[#0B64A0]">
                    <CheckCircle2 size={16} />
                    <span>Bước 4 · Hội đồng ĐHĐN xét chọn</span>
                  </div>
                  <p className="text-[#2C4A5F] text-[13px] leading-relaxed">
                    Hội đồng xét chọn cấp Đại học Đà Nẵng thẩm định tập trung, ra quyết định công nhận và tổ chức lễ vinh danh.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#CFE0EC] bg-white space-y-2">
                <div className="text-[12px] font-extrabold uppercase tracking-wider text-[#0E2538]">
                  Quy định về tệp minh chứng hợp lệ:
                </div>
                <ul className="list-disc pl-5 space-y-1.5 text-[13px] text-[#2C4A5F]">
                  <li>
                    Bảng điểm học tập và kết quả rèn luyện cần có xác nhận của Phòng Đào tạo / Phòng Công tác Sinh viên hoặc trích xuất có mã xác thực từ cổng quản lý đào tạo chính thức của trường thành viên.
                  </li>
                  <li>
                    Giấy chứng nhận, bằng khen, quyết định công nhận hoạt động tình nguyện, NCKH, thể thao phải thể hiện rõ họ tên, mã SV, năm học và cơ quan cấp.
                  </li>
                  <li>
                    Chứng chỉ ngoại ngữ quốc tế cần còn thời hạn giá trị hoặc phù hợp quy định chuẩn đầu ra của đơn vị đào tạo.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#F5F9FC] border-t border-[#CFE0EC] flex items-center justify-between gap-4 shrink-0">
          <span className="text-[12px] font-medium text-[#526B7E]">
            Hội Sinh viên Việt Nam Đại học Đà Nẵng · Năm học {UDN_PORTAL_CONFIG.academicYear}
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-[36px] px-4 rounded-lg border border-[#CBDDEB] bg-white hover:bg-[#F3F8FC] text-[13px] font-bold text-[#0E2538] transition-colors cursor-pointer"
            >
              Đóng
            </button>

            {activeTab === 'collective' && onNavigateToCollectiveLogin ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToCollectiveLogin();
                }}
                className="inline-flex items-center gap-1.5 h-[36px] px-4 rounded-lg bg-[#0D9488] hover:bg-[#0B7A70] text-white text-[13px] font-bold transition-colors cursor-pointer"
              >
                <span>Vào Cổng Tập thể</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartApplication();
                }}
                className="inline-flex items-center gap-1.5 h-[36px] px-4 rounded-lg bg-[#0B64A0] hover:bg-[#095386] text-white text-[13px] font-bold transition-colors cursor-pointer shadow-xs"
              >
                <span>Bắt đầu kê khai</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
