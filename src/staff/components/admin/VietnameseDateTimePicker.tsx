/**
 * 5TOT ĐHĐN — Friendly Vietnamese Calendar Date & Time Picker
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Replaces raw text inputs ("01/10/2026 · 08:00") with:
 * - Native Calendar Date Picker (<input type="date">)
 * - Native Time Picker (<input type="time">)
 * - 1-click Time Presets (08:00, 17:00, 20:00, 23:59) & Day Shift (+3 ngày, +7 ngày)
 * - Auto-schedule helper to compute a full T01–T07 timeline from a single opening date.
 */

import React from 'react';
import { Calendar, Clock } from 'lucide-react';

export interface ParsedVnDateTime {
  dateIso: string; // YYYY-MM-DD
  timeHm: string; // HH:mm
}

export function parseVnDateTimeString(
  raw: string | undefined | null,
  fallbackDate = '2026-10-01',
  fallbackTime = '08:00'
): ParsedVnDateTime {
  if (!raw || !raw.trim()) {
    return { dateIso: fallbackDate, timeHm: fallbackTime };
  }
  const cleaned = raw
    .trim()
    .replace(/\s*\((?:GMT|UTC)\+?0?7(?::00)?\)\s*$/i, '')
    .trim();

  // Match DD/MM/YYYY · HH:MM or DD/MM/YYYY HH:MM
  const vnMatch = cleaned.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s*(?:·|-|,|\s)\s*(\d{1,2}):(\d{2}))?/
  );
  if (vnMatch) {
    const dd = vnMatch[1].padStart(2, '0');
    const mm = vnMatch[2].padStart(2, '0');
    const yyyy = vnMatch[3];
    const hh = vnMatch[4] ? vnMatch[4].padStart(2, '0') : fallbackTime.slice(0, 2);
    const min = vnMatch[5] ? vnMatch[5].padStart(2, '0') : fallbackTime.slice(3, 5);
    return {
      dateIso: `${yyyy}-${mm}-${dd}`,
      timeHm: `${hh}:${min}`,
    };
  }

  // Match YYYY-MM-DD or ISO
  const isoMatch = cleaned.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/
  );
  if (isoMatch) {
    return {
      dateIso: `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`,
      timeHm:
        isoMatch[4] && isoMatch[5]
          ? `${isoMatch[4]}:${isoMatch[5]}`
          : fallbackTime,
    };
  }

  return { dateIso: fallbackDate, timeHm: fallbackTime };
}

export function formatToVnDateTimeString(dateIso: string, timeHm: string): string {
  const parts = dateIso.split('-');
  if (parts.length !== 3) return `01/10/2026 · ${timeHm || '08:00'}`;
  const [yyyy, mm, dd] = parts;
  return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy} · ${timeHm || '08:00'}`;
}

export function shiftVnDateTimeByDays(
  raw: string,
  daysToAdd: number,
  overrideTimeHm?: string
): string {
  const { dateIso, timeHm } = parseVnDateTimeString(raw);
  const [yyyy, mm, dd] = dateIso.split('-').map(Number);
  const dt = new Date(yyyy, (mm || 1) - 1, dd || 1);
  dt.setDate(dt.getDate() + daysToAdd);
  const nextIso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  return formatToVnDateTimeString(nextIso, overrideTimeHm || timeHm);
}

/**
 * Generates a complete, chronologically valid T01–T07 schedule starting from `openingDateVi`.
 */
export function generateStandardTimelineFromStart(openingDateVi: string) {
  const { dateIso } = parseVnDateTimeString(openingDateVi, '2026-10-01', '08:00');
  const startVi = formatToVnDateTimeString(dateIso, '08:00');
  return {
    submissionStart: startVi,
    submissionDeadline: shiftVnDateTimeByDays(startVi, 20, '20:00'),
    schoolReviewStart: shiftVnDateTimeByDays(startVi, 3, '08:00'),
    schoolReviewDeadline: shiftVnDateTimeByDays(startVi, 23, '17:00'),
    schoolForwardingDeadline: shiftVnDateTimeByDays(startVi, 25, '17:00'),
    collectiveSubmissionStart: startVi,
    collectiveSubmissionDeadline: shiftVnDateTimeByDays(startVi, 25, '20:00'),
    reviewStart: shiftVnDateTimeByDays(startVi, 26, '08:00'),
    supplementStart: shiftVnDateTimeByDays(startVi, 26, '08:00'),
    supplementDeadline: shiftVnDateTimeByDays(startVi, 31, '20:00'),
    reviewDeadline: shiftVnDateTimeByDays(startVi, 35, '17:00'),
    committeeDate: shiftVnDateTimeByDays(startVi, 38, '08:30'),
    publicationTargetDate: shiftVnDateTimeByDays(startVi, 42, '09:00'),
  };
}

export interface VietnameseDateTimePickerProps {
  label: string;
  stageBadge?: string;
  value: string;
  onChange: (newVnDateTime: string) => void;
  helperText?: string;
  showQuickShifts?: boolean;
  required?: boolean;
  testId?: string;
}

const QUICK_TIMES = [
  { time: '08:00', label: '08:00 Sáng' },
  { time: '17:00', label: '17:00 Chiều' },
  { time: '20:00', label: '20:00 Tối' },
  { time: '23:59', label: '23:59 Cuối ngày' },
];

export const VietnameseDateTimePicker: React.FC<
  VietnameseDateTimePickerProps
> = ({
  label,
  stageBadge,
  value,
  onChange,
  helperText,
  showQuickShifts = false,
  required = false,
  testId,
}) => {
  const { dateIso, timeHm } = parseVnDateTimeString(value);

  const handleDateChange = (nextDateIso: string) => {
    if (!nextDateIso) return;
    onChange(formatToVnDateTimeString(nextDateIso, timeHm));
  };

  const handleTimeChange = (nextTimeHm: string) => {
    if (!nextTimeHm) return;
    onChange(formatToVnDateTimeString(dateIso, nextTimeHm));
  };

  return (
    <div
      data-testid={testId}
      className="p-3 rounded-[10px] bg-white border border-[#D8E5EE] hover:border-[#0D78AE]/60 transition-colors space-y-2"
    >
      <div className="flex items-center justify-between gap-2">
        <label className="text-[12px] font-bold text-[#0F2335] flex items-center gap-1.5">
          {stageBadge && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#EBF6FC] text-[#0D78AE] border border-[#CCE7F6]">
              {stageBadge}
            </span>
          )}
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </label>
        <span className="text-[11px] font-extrabold text-[#0D78AE] bg-[#F2F9FD] px-2 py-0.5 rounded tabular-nums border border-[#DCEEFA]">
          {formatToVnDateTimeString(dateIso, timeHm)}
        </span>
      </div>

      {/* Native Calendar Date + Time Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        <div className="sm:col-span-7 relative flex items-center">
          <Calendar
            size={13}
            className="text-[#0D78AE] absolute left-2.5 pointer-events-none"
          />
          <input
            type="date"
            value={dateIso}
            onChange={(e) => handleDateChange(e.target.value)}
            aria-label={`${label} - Chọn ngày`}
            className="w-full h-[36px] pl-8 pr-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[7px] text-[12.5px] font-semibold text-[#0F2335] outline-none focus:border-[#0D78AE] focus:bg-white cursor-pointer"
          />
        </div>
        <div className="sm:col-span-5 relative flex items-center">
          <Clock
            size={13}
            className="text-[#0D78AE] absolute left-2.5 pointer-events-none"
          />
          <input
            type="time"
            value={timeHm}
            onChange={(e) => handleTimeChange(e.target.value)}
            aria-label={`${label} - Chọn giờ`}
            className="w-full h-[36px] pl-8 pr-2 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[7px] text-[12.5px] font-semibold text-[#0F2335] outline-none focus:border-[#0D78AE] focus:bg-white cursor-pointer tabular-nums"
          />
        </div>
      </div>

      {/* Quick Time Presets + Optional Day Shift Pills */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10.5px] text-[#607483] mr-0.5">Giờ chuẩn:</span>
          {QUICK_TIMES.map((preset) => {
            const active = timeHm === preset.time;
            return (
              <button
                key={preset.time}
                type="button"
                onClick={() => handleTimeChange(preset.time)}
                className={`px-1.5 py-0.5 rounded text-[10.5px] font-bold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0D78AE] text-white'
                    : 'bg-[#F1F6FA] text-[#476275] hover:bg-[#E2EFF7] hover:text-[#0D78AE]'
                }`}
              >
                {preset.time}
              </button>
            );
          })}
        </div>

        {showQuickShifts && (
          <div className="flex items-center gap-1">
            {[
              { d: 1, label: '+1 ngày' },
              { d: 3, label: '+3 ngày' },
              { d: 7, label: '+7 ngày' },
            ].map((sh) => (
              <button
                key={sh.d}
                type="button"
                onClick={() =>
                  onChange(
                    shiftVnDateTimeByDays(
                      formatToVnDateTimeString(dateIso, timeHm),
                      sh.d
                    )
                  )
                }
                className="px-1.5 py-0.5 rounded text-[10.5px] font-bold bg-[#EBF6FC] text-[#0D78AE] hover:bg-[#DCEEFA] border border-[#CCE7F6] cursor-pointer"
              >
                {sh.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {helperText && (
        <div className="text-[11px] text-[#526B7C] leading-snug">
          {helperText}
        </div>
      )}
    </div>
  );
};
