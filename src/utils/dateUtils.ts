/**
 * 5TOT ĐHĐN — Date / Time Parsing & Formatting Utilities
 */

export function parseFlexibleDateTime(input?: string | Date | null): Date | undefined {
  if (!input) return undefined;
  if (input instanceof Date) return isNaN(input.getTime()) ? undefined : input;
  const s = String(input).trim();
  if (!s) return undefined;

  const standardParsed = Date.parse(s);
  if (!isNaN(standardParsed)) return new Date(standardParsed);

  // Match Vietnamese formats: "20:00 · 31/10/2026", "20:00 31/10/2026", "20:00, 31/10/2026"
  const vnMatch = s.match(/(\d{1,2}):(\d{2})\s*(?:·|,|-)?\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (vnMatch) {
    const [, hour, min, day, month, year] = vnMatch;
    const isoStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${min.padStart(2, '0')}:00+07:00`;
    const d = new Date(isoStr);
    if (!isNaN(d.getTime())) return d;
  }

  // Match date only: "31/10/2026"
  const dateOnlyMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dateOnlyMatch) {
    const [, day, month, year] = dateOnlyMatch;
    const isoStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T23:59:59+07:00`;
    const d = new Date(isoStr);
    if (!isNaN(d.getTime())) return d;
  }

  return undefined;
}

export function formatVietnameseDateTime(date?: string | Date | null): string {
  const d = parseFlexibleDateTime(date);
  if (!d) return 'Trong vòng 72 giờ kể từ khi nhận được thông báo này';

  try {
    const parts = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour12: false,
    }).formatToParts(d);
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return `${map.hour}:${map.minute} · Ngày ${map.day}/${map.month}/${map.year}`;
  } catch {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${minutes} · Ngày ${day}/${month}/${year}`;
  }
}
