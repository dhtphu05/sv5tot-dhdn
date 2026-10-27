/**
 * 5TOT ĐHĐN — Five-Criteria Strip (Approved Visual Reference)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Sections 21, 22, 23, 24, 38, 44, 48:
 * - Label above strip: circular star marker + "05 TIÊU CHUẨN XÉT CHỌN SINH VIÊN 5 TỐT"
 * - Five horizontally aligned compact items (height ~66px, radius 13px, white surface, subtle border/shadow):
 *   01 Đạo đức tốt (Ethics: Blue)
 *   02 Học tập tốt (Academic: Violet)
 *   03 Thể lực tốt (Physical: Amber / Warm)
 *   04 Tình nguyện tốt (Volunteer: Green)
 *   05 Hội nhập tốt (Integration: Teal / Cyan)
 */

import React from 'react';
import {
  Heart,
  GraduationCap,
  Activity,
  Users,
  Globe,
  Star,
} from 'lucide-react';
import { CRITERIA, CriterionDefinition } from '../../../tokens';

export interface FiveCriteriaStripProps {
  activeCriterionId?: CriterionDefinition['id'] | null;
  onHoverCriterion?: (id: CriterionDefinition['id'] | null) => void;
  className?: string;
}

const OFFICIAL_CRITERIA_ITEMS: {
  id: CriterionDefinition['id'];
  number: string;
  name: string;
  accentColor: string;
  softBg: string;
}[] = [
  {
    id: 'ethics',
    number: '01',
    name: 'Đạo đức tốt',
    accentColor: CRITERIA.ethics.accentColor,
    softBg: CRITERIA.ethics.bgTint,
  },
  {
    id: 'academic',
    number: '02',
    name: 'Học tập tốt',
    accentColor: CRITERIA.academic.accentColor,
    softBg: CRITERIA.academic.bgTint,
  },
  {
    id: 'physical',
    number: '03',
    name: 'Thể lực tốt',
    accentColor: CRITERIA.physical.accentColor,
    softBg: CRITERIA.physical.bgTint,
  },
  {
    id: 'volunteer',
    number: '04',
    name: 'Tình nguyện tốt',
    accentColor: CRITERIA.volunteer.accentColor,
    softBg: CRITERIA.volunteer.bgTint,
  },
  {
    id: 'integration',
    number: '05',
    name: 'Hội nhập tốt',
    accentColor: CRITERIA.integration.accentColor,
    softBg: CRITERIA.integration.bgTint,
  },
];

export const FiveCriteriaStrip: React.FC<FiveCriteriaStripProps> = ({
  activeCriterionId = null,
  onHoverCriterion,
  className = '',
}) => {
  const renderCriterionIcon = (
    id: CriterionDefinition['id'],
    accentColor: string
  ) => {
    const props = {
      size: 20,
      style: { color: accentColor },
      strokeWidth: 2,
    };
    switch (id) {
      case 'ethics':
        return <Heart {...props} />;
      case 'academic':
        return <GraduationCap {...props} />;
      case 'physical':
        return <Activity {...props} />;
      case 'volunteer':
        return <Users {...props} />;
      case 'integration':
        return <Globe {...props} />;
    }
  };

  return (
    <div
      id="nam-tieu-chi-xet-chon"
      aria-label="05 tiêu chuẩn xét chọn Sinh viên 5 tốt"
      className={`gsap-criteria-section space-y-3 ${className}`}
    >
      {/* Section 21: Five-Criteria Label */}
      <div className="flex items-center gap-2.5">
        <span className="w-5 h-5 rounded-full bg-[#1570A6] text-white inline-flex items-center justify-center shrink-0">
          <Star size={11} fill="currentColor" strokeWidth={2} />
        </span>
        <span className="text-[12.5px] sm:text-[13px] font-extrabold uppercase tracking-[0.06em] text-[#243B53]">
          05 TIÊU CHUẨN XÉT CHỌN{' '}
          <span className="text-[#0D6EB0]">SINH VIÊN 5 TỐT</span>
        </span>
      </div>

      {/* Section 22–24: Five Horizontally Aligned Compact Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {OFFICIAL_CRITERIA_ITEMS.map((item) => {
          const isActive = activeCriterionId === item.id;
          return (
            <div
              key={item.id}
              onMouseEnter={() => onHoverCriterion && onHoverCriterion(item.id)}
              onMouseLeave={() => onHoverCriterion && onHoverCriterion(null)}
              className={`gsap-criterion-card h-[66px] px-4 rounded-[13px] bg-white/95 border transition-all duration-150 flex items-center gap-3 select-none ${
                isActive
                  ? 'border-[#A7CBE6] bg-[#F7FBFE] shadow-[0_6px_18px_rgba(13,110,176,0.08)] -translate-y-[1px]'
                  : 'border-[#E1EEF7] hover:border-[#BFD9EC] shadow-[0_4px_14px_rgba(13,110,176,0.04)] hover:-translate-y-[1px]'
              }`}
            >
              {/* Soft Tinted Number Circle */}
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center text-[13.5px] font-extrabold tabular-nums shrink-0"
                style={{
                  backgroundColor: item.softBg,
                  color: item.accentColor,
                }}
              >
                {item.number}
              </span>

              {/* Small Criterion Icon */}
              <span className="shrink-0 flex items-center justify-center">
                {renderCriterionIcon(item.id, item.accentColor)}
              </span>

              {/* Criterion Title */}
              <span className="text-[14.5px] xl:text-[15px] font-extrabold text-[#0F2335] truncate">
                {item.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
