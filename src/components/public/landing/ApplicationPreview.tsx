/**
 * 5TOT ĐHĐN — Simplified Application Preview (Approved Visual Reference + Real Product Semantics)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Sections 25, 26, 27, 28, 48:
 * - Large soft container with a subtle blue-tinted frame matching the approved visual reference.
 * - Left mini sidebar:
 *   Tổng quan | Hồ sơ của tôi | Kho minh chứng | Kết quả xét chọn
 * - Main workspace surface:
 *   Hồ sơ Sinh viên 5 tốt · Cấp Đại học Đà Nẵng
 *   Nguyễn Minh Anh · Trường ĐH Bách khoa – ĐHĐN · Năm học 2026–2027
 *   Status: Đang hoàn thiện
 * - Strict adherence to Section 26 & 27:
 *   - NO completion percentage (no "80%", "60%")
 *   - NO "3/5 tiêu chí đạt"
 *   - NO progress bars implying criterion success
 *   - Uses approved factual declaration & evidence summaries:
 *     - Học tập tốt: 3 nội dung đã kê khai
 *     - Thể lực tốt: 2 hình thức đã kê khai
 *     - Tình nguyện tốt: 3 hoạt động đã kê khai
 */

import React from 'react';
import {
  Home,
  UserCheck,
  FolderCheck,
  Award,
  GraduationCap,
  Activity,
  Users,
  Heart,
  Globe,
  FileText,
} from 'lucide-react';
import { HsvEmblem } from '../../brand/HsvLogo';
import { CRITERIA, CriterionDefinition } from '../../../tokens';

export interface ApplicationPreviewProps {
  highlightedCriterionId?: CriterionDefinition['id'] | null;
}

const PRIMARY_PREVIEW_CARDS: {
  id: CriterionDefinition['id'];
  number: string;
  title: string;
  declarationCountText: string;
  evidenceSummary: string;
  statusLabel: string;
  accentColor: string;
  softBg: string;
}[] = [
  {
    id: 'academic',
    number: '02',
    title: 'Học tập tốt',
    declarationCountText: '3 nội dung đã kê khai',
    evidenceSummary: 'GPA 3.62/4.0 · Bài báo khoa học',
    statusLabel: 'Đã có minh chứng',
    accentColor: CRITERIA.academic.accentColor,
    softBg: CRITERIA.academic.bgTint,
  },
  {
    id: 'physical',
    number: '03',
    title: 'Thể lực tốt',
    declarationCountText: '2 hình thức đã kê khai',
    evidenceSummary: 'Danh hiệu Sinh viên khỏe cấp Trường',
    statusLabel: 'Đã có minh chứng',
    accentColor: CRITERIA.physical.accentColor,
    softBg: CRITERIA.physical.bgTint,
  },
  {
    id: 'volunteer',
    number: '04',
    title: 'Tình nguyện tốt',
    declarationCountText: '3 hoạt động đã kê khai',
    evidenceSummary: 'Chiến dịch Mùa hè xanh · 05 ngày',
    statusLabel: 'Đã có minh chứng',
    accentColor: CRITERIA.volunteer.accentColor,
    softBg: CRITERIA.volunteer.bgTint,
  },
];

const SECONDARY_PREVIEW_ROWS: {
  id: CriterionDefinition['id'];
  number: string;
  title: string;
  declarationCountText: string;
  evidenceCount: string;
  statusLabel: string;
  accentColor: string;
  softBg: string;
}[] = [
  {
    id: 'ethics',
    number: '01',
    title: 'Đạo đức tốt',
    declarationCountText: '2 nội dung đã kê khai',
    evidenceCount: '2 tệp minh chứng',
    statusLabel: 'Đã có minh chứng',
    accentColor: CRITERIA.ethics.accentColor,
    softBg: CRITERIA.ethics.bgTint,
  },
  {
    id: 'integration',
    number: '05',
    title: 'Hội nhập tốt',
    declarationCountText: '2 nội dung đã kê khai',
    evidenceCount: '2 tệp minh chứng',
    statusLabel: 'Đã có minh chứng',
    accentColor: CRITERIA.integration.accentColor,
    softBg: CRITERIA.integration.bgTint,
  },
];

export const ApplicationPreview: React.FC<ApplicationPreviewProps> = ({
  highlightedCriterionId = null,
}) => {
  const renderCardIcon = (
    id: CriterionDefinition['id'],
    accentColor: string
  ) => {
    const props = { size: 19, style: { color: accentColor }, strokeWidth: 2 };
    switch (id) {
      case 'academic':
        return <GraduationCap {...props} />;
      case 'physical':
        return <Activity {...props} />;
      case 'volunteer':
        return <Users {...props} />;
      case 'ethics':
        return <Heart {...props} />;
      case 'integration':
        return <Globe {...props} />;
    }
  };

  return (
    <div
      aria-label="Minh họa giao diện Hồ sơ Sinh viên 5 tốt"
      className="gsap-application-preview w-full rounded-[22px] bg-gradient-to-b from-[#E5F1FA]/90 to-[#EDF5FC]/90 p-3 sm:p-4 border border-[#CFE2F0] shadow-[0_14px_38px_rgba(13,110,176,0.075)] select-none"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* LEFT MINI SIDEBAR (Section 28) */}
        <div className="hidden lg:flex lg:col-span-3 flex-col justify-between bg-[#F6FAFE] rounded-[15px] border border-[#DCEAF4] p-4">
          <div>
            {/* Mini Sidebar Header */}
            <div className="flex items-center gap-2.5 pb-3.5 border-b border-[#E5EFF6]">
              <HsvEmblem size={32} />
              <div className="leading-tight min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#526B7E] truncate">
                  HỆ THỐNG XÉT DUYỆT
                </div>
                <div className="text-[12px] font-extrabold uppercase text-[#0D6EB0] truncate">
                  SINH VIÊN 5 TỐT
                </div>
              </div>
            </div>

            {/* Simplified 4-Item Navigation */}
            <div className="mt-3.5 space-y-1">
              <div className="px-3 py-2 rounded-[9px] bg-[#DCF0FC] text-[#0B64A0] text-[13px] font-bold flex items-center gap-2.5">
                <Home size={15.5} strokeWidth={2.2} className="shrink-0" />
                <span>Tổng quan</span>
              </div>
              <div className="px-3 py-2 rounded-[9px] text-[#3B5266] text-[13px] font-medium flex items-center gap-2.5">
                <UserCheck size={15.5} strokeWidth={1.9} className="text-[#5A7184] shrink-0" />
                <span>Hồ sơ của tôi</span>
              </div>
              <div className="px-3 py-2 rounded-[9px] text-[#3B5266] text-[13px] font-medium flex items-center gap-2.5">
                <FolderCheck size={15.5} strokeWidth={1.9} className="text-[#5A7184] shrink-0" />
                <span>Kho minh chứng</span>
              </div>
              <div className="px-3 py-2 rounded-[9px] text-[#3B5266] text-[13px] font-medium flex items-center gap-2.5">
                <Award size={15.5} strokeWidth={1.9} className="text-[#5A7184] shrink-0" />
                <span>Kết quả xét chọn</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5EFF6] flex items-center justify-between text-[11px] text-[#5A7184] font-medium">
            <span>Đợt xét chọn cấp TP</span>
            <span className="font-bold text-[#0D6EB0] tabular-nums">2026–2027</span>
          </div>
        </div>

        {/* RIGHT MAIN WORKSPACE SURFACE (Sections 25, 26, 27) */}
        <div className="lg:col-span-9 bg-white rounded-[15px] border border-[#DCEAF4] p-5 sm:p-6 shadow-[0_2px_10px_rgba(13,110,176,0.03)] flex flex-col justify-between gap-4">
          {/* Top Window Dots + Dossier Header */}
          <div>
            <div className="flex items-center gap-1.5 mb-3" aria-hidden="true">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B9D5EA]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#9FD9C0]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#C8DDF0]" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#ECF3F8]">
              <div className="min-w-0">
                <div className="text-[16.5px] sm:text-[18.5px] font-extrabold text-[#0F2335] tracking-tight">
                  Hồ sơ Sinh viên 5 tốt · Cấp Đại học Đà Nẵng
                </div>
                <div className="text-[13px] text-[#526B7E] font-medium mt-0.5 truncate">
                  Nguyễn Minh Anh · Trường ĐH Bách khoa – ĐHĐN · MSSV: 102220123 · Năm học 2026–2027
                </div>
              </div>

              <span className="self-start sm:self-auto shrink-0 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8F3FC] text-[#0B64A0] text-[12.5px] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#0D6EB0]" />
                <span>Đang hoàn thiện</span>
              </span>
            </div>
          </div>

          {/* Three Primary Summary Cards (Section 27 — No progress bars or fake percentages) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {PRIMARY_PREVIEW_CARDS.map((card) => {
              const isHighlighted = highlightedCriterionId === card.id;
              return (
                <div
                  key={card.id}
                  className={`p-3.5 rounded-[12px] border transition-colors duration-150 flex items-start gap-3 ${
                    isHighlighted
                      ? 'bg-[#F3FAFE] border-[#9EC5E2]'
                      : 'bg-[#FAFCFE] border-[#E5EFF6]'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: card.softBg }}
                  >
                    {renderCardIcon(card.id, card.accentColor)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[13.5px] font-extrabold text-[#0F2335] truncate">
                        {card.title}
                      </span>
                      <span
                        className="text-[11px] font-extrabold tabular-nums"
                        style={{ color: card.accentColor }}
                      >
                        {card.number}
                      </span>
                    </div>

                    <div className="text-[13px] font-bold text-[#0D6EB0] mt-0.5">
                      {card.declarationCountText}
                    </div>

                    <div className="text-[11.5px] text-[#526B7E] truncate mt-0.5">
                      {card.evidenceSummary}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compact Excerpt Strip for Ethics & Integration Criteria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {SECONDARY_PREVIEW_ROWS.map((row) => {
              const isHighlighted = highlightedCriterionId === row.id;
              return (
                <div
                  key={row.id}
                  className={`px-3.5 py-2.5 rounded-[10px] border transition-colors duration-150 flex items-center justify-between gap-2 ${
                    isHighlighted
                      ? 'bg-[#F3FAFE] border-[#9EC5E2]'
                      : 'bg-white border-[#E8F1F7]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[11.5px] font-extrabold tabular-nums shrink-0"
                      style={{
                        backgroundColor: row.softBg,
                        color: row.accentColor,
                      }}
                    >
                      {row.number}
                    </span>
                    <span className="text-[13px] font-extrabold text-[#0F2335] truncate">
                      {row.title}
                    </span>
                    <span className="text-[#C5D8E6]">·</span>
                    <span className="text-[12.5px] font-semibold text-[#3B5266] truncate">
                      {row.declarationCountText}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#157347] bg-[#EAF7F0] px-2.5 py-0.5 rounded-full shrink-0">
                    <FileText size={11.5} />
                    <span>{row.evidenceCount}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
