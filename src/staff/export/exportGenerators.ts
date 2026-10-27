import { FormattedReportRow, ReportColumnDefinition, ReportColumnKey, ReportDefinition } from "./exportTypes";
import { StaffApplicationRecord, StaffUser } from "../types";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getExcelColumnLetter(colIndexZeroBased: number): string {
  let temp = colIndexZeroBased;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

// CRC32 Table for standard ZIP archive creation
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createStoreZipArchive(
  files: { path: string; content: string }[]
): Uint8Array {
  const encoder = new TextEncoder();
  const encodedFiles = files.map((f) => ({
    pathBytes: encoder.encode(f.path),
    dataBytes: encoder.encode(f.content),
  }));

  let totalLocalSize = 0;
  let totalCentralSize = 0;
  for (const f of encodedFiles) {
    totalLocalSize += 30 + f.pathBytes.length + f.dataBytes.length;
    totalCentralSize += 46 + f.pathBytes.length;
  }

  const out = new Uint8Array(totalLocalSize + totalCentralSize + 22);
  const view = new DataView(out.buffer);

  let localOffset = 0;
  const offsets: number[] = [];
  const crcs: number[] = [];

  for (const f of encodedFiles) {
    offsets.push(localOffset);
    const fileCrc = crc32(f.dataBytes);
    crcs.push(fileCrc);

    // Local file header signature (0x04034b50)
    view.setUint32(localOffset, 0x04034b50, true);
    view.setUint16(localOffset + 4, 20, true); // version needed
    view.setUint16(localOffset + 6, 0x0800, true); // UTF-8 flag
    view.setUint16(localOffset + 8, 0, true); // compression: STORE (0)
    view.setUint16(localOffset + 10, 0, true); // mod time
    view.setUint16(localOffset + 12, 0, true); // mod date
    view.setUint32(localOffset + 14, fileCrc, true);
    view.setUint32(localOffset + 18, f.dataBytes.length, true);
    view.setUint32(localOffset + 22, f.dataBytes.length, true);
    view.setUint16(localOffset + 26, f.pathBytes.length, true);
    view.setUint16(localOffset + 28, 0, true);

    out.set(f.pathBytes, localOffset + 30);
    out.set(f.dataBytes, localOffset + 30 + f.pathBytes.length);

    localOffset += 30 + f.pathBytes.length + f.dataBytes.length;
  }

  const centralDirStart = localOffset;
  let centralOffset = centralDirStart;

  for (let i = 0; i < encodedFiles.length; i++) {
    const f = encodedFiles[i];
    // Central directory file header signature (0x02014b50)
    view.setUint32(centralOffset, 0x02014b50, true);
    view.setUint16(centralOffset + 4, 20, true); // version made by
    view.setUint16(centralOffset + 6, 20, true); // version needed
    view.setUint16(centralOffset + 8, 0x0800, true); // UTF-8 flag
    view.setUint16(centralOffset + 10, 0, true); // compression: STORE
    view.setUint16(centralOffset + 12, 0, true);
    view.setUint16(centralOffset + 14, 0, true);
    view.setUint32(centralOffset + 16, crcs[i], true);
    view.setUint32(centralOffset + 20, f.dataBytes.length, true);
    view.setUint32(centralOffset + 24, f.dataBytes.length, true);
    view.setUint16(centralOffset + 28, f.pathBytes.length, true);
    view.setUint16(centralOffset + 30, 0, true);
    view.setUint16(centralOffset + 32, 0, true);
    view.setUint16(centralOffset + 34, 0, true);
    view.setUint16(centralOffset + 36, 0, true);
    view.setUint32(centralOffset + 38, 0, true);
    view.setUint32(centralOffset + 42, offsets[i], true);

    out.set(f.pathBytes, centralOffset + 46);
    centralOffset += 46 + f.pathBytes.length;
  }

  // End of central directory record (0x06054b50)
  view.setUint32(centralOffset, 0x06054b50, true);
  view.setUint16(centralOffset + 4, 0, true);
  view.setUint16(centralOffset + 6, 0, true);
  view.setUint16(centralOffset + 8, encodedFiles.length, true);
  view.setUint16(centralOffset + 10, encodedFiles.length, true);
  view.setUint32(centralOffset + 12, centralOffset - centralDirStart, true);
  view.setUint32(centralOffset + 16, centralDirStart, true);
  view.setUint16(centralOffset + 20, 0, true);

  return out;
}

/**
 * Generates a standards-compliant OpenXML (.xlsx) workbook with:
 * - Sheet 1: "Danh sách" (Frozen row 1, AutoFilter, column widths, sequential STT 1..N)
 * - Sheet 2: "Thông tin xuất" (Report metadata, scope, filters, exporter, timestamp)
 */
export function generateXlsxBinary(params: {
  report: ReportDefinition;
  columns: ReportColumnDefinition[];
  rows: FormattedReportRow[];
  scopeLabel: string;
  filterSummaryLabel: string;
  exporter: StaffUser;
  exportedAt: string;
  schoolYear?: string;
}): Uint8Array {
  const {
    report,
    columns,
    rows,
    scopeLabel,
    filterSummaryLabel,
    exporter,
    exportedAt,
    schoolYear,
  } = params;

  const lastColLetter = getExcelColumnLetter(Math.max(0, columns.length - 1));
  const totalSheetRows = rows.length + 1;

  // Build <cols> width definitions
  const colsXml = `<cols>${columns
    .map(
      (col, idx) =>
        `<col min="${idx + 1}" max="${idx + 1}" width="${col.excelWidth}" customWidth="1"/>`
    )
    .join('')}</cols>`;

  // Row 1: Header row (style s="1")
  const headerCellsXml = columns
    .map((col, idx) => {
      const ref = `${getExcelColumnLetter(idx)}1`;
      return `<c r="${ref}" t="inlineStr" s="1"><is><t>${escapeXml(
        col.label
      )}</t></is></c>`;
    })
    .join('');

  // Data rows: STT is sequential 1, 2, 3... (Section 68)
  const dataRowsXml = rows
    .map((row, rowIdx) => {
      const excelRowNum = rowIdx + 2;
      const cellsXml = columns
        .map((col, colIdx) => {
          const ref = `${getExcelColumnLetter(colIdx)}${excelRowNum}`;
          if (col.key === 'stt') {
            return `<c r="${ref}" t="n" s="2"><v>${rowIdx + 1}</v></c>`;
          }
          let rawVal = String(
            (row as unknown as Record<string, unknown>)[col.key] ?? ''
          );
          // Prevent formula injection (e.g. leading =, +, -, @)
          if (/^[=+\-@\t\r]/.test(rawVal)) {
            rawVal = `'${rawVal}`;
          }
          return `<c r="${ref}" t="inlineStr" s="2"><is><t>${escapeXml(
            rawVal
          )}</t></is></c>`;
        })
        .join('');
      return `<row r="${excelRowNum}" ht="22" customHeight="1">${cellsXml}</row>`;
    })
    .join('');

  const sheet1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews>
    <sheetView tabSelected="1" workbookViewId="0">
      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  ${colsXml}
  <sheetData>
    <row r="1" ht="26" customHeight="1">${headerCellsXml}</row>
    ${dataRowsXml}
  </sheetData>
  <autoFilter ref="A1:${lastColLetter}${totalSheetRows}"/>
</worksheet>`;

  // Sheet 2: "Thông tin xuất" (Section 66)
  const cleanYear = (schoolYear || '2025–2026').replace(/^Năm học\s+/i, '').trim() || '2025–2026';
  const metaPairs: [string, string][] = [
    ['Tên báo cáo', report.label],
    ['Cơ quan quản lý', 'Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng'],
    ['Đơn vị tổ chức', 'Hội Sinh viên Việt Nam Đại học Đà Nẵng'],
    ['Năm học', cleanYear],
    ['Phạm vi xuất', scopeLabel],
    ['Bộ lọc áp dụng', filterSummaryLabel],
    ['Tổng số bản ghi', `${rows.length} hồ sơ`],
    ['Thời điểm xuất', exportedAt],
    ['Người xuất', `${exporter.fullName} (${exporter.roleLabel})`],
  ];

  const sheet2RowsXml = metaPairs
    .map(([k, v], idx) => {
      const rNum = idx + 1;
      return `<row r="${rNum}" ht="22" customHeight="1">
        <c r="A${rNum}" t="inlineStr" s="1"><is><t>${escapeXml(k)}</t></is></c>
        <c r="B${rNum}" t="inlineStr" s="2"><is><t>${escapeXml(v)}</t></is></c>
      </row>`;
    })
    .join('');

  const sheet2Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="26" customWidth="1"/>
    <col min="2" max="2" width="58" customWidth="1"/>
  </cols>
  <sheetData>
    ${sheet2RowsXml}
  </sheetData>
</worksheet>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><color rgb="FF0F2335"/><name val="Arial"/></font>
    <font><b/><sz val="11"/><color rgb="FF0F2335"/><name val="Arial"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEEF4F8"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFD4E2EC"/></left>
      <right style="thin"><color rgb="FFD4E2EC"/></right>
      <top style="thin"><color rgb="FFD4E2EC"/></top>
      <bottom style="thin"><color rgb="FFD4E2EC"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment vertical="center" wrapText="1"/>
    </xf>
  </cellXfs>
</styleSheet>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Danh sách" sheetId="1" r:id="rId1"/>
    <sheet name="Thông tin xuất" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  return createStoreZipArchive([
    { path: '[Content_Types].xml', content: contentTypesXml },
    { path: '_rels/.rels', content: rootRelsXml },
    { path: 'xl/workbook.xml', content: workbookXml },
    { path: 'xl/_rels/workbook.xml.rels', content: workbookRelsXml },
    { path: 'xl/styles.xml', content: stylesXml },
    { path: 'xl/worksheets/sheet1.xml', content: sheet1Xml },
    { path: 'xl/worksheets/sheet2.xml', content: sheet2Xml },
  ]);
}

/**
 * Generates UTF-8 with BOM CSV content so Excel preserves Vietnamese diacritics (Section 69)
 */
export function generateCsvContent(params: {
  columns: ReportColumnDefinition[];
  rows: FormattedReportRow[];
}): string {
  const { columns, rows } = params;

  const escapeCsvField = (val: string): string => {
    let str = String(val ?? '');
    // Prevent spreadsheet formula injection
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    if (
      str.includes(',') ||
      str.includes('"') ||
      str.includes('\n') ||
      str.includes('\r')
    ) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = columns.map((c) => escapeCsvField(c.label)).join(',');
  const dataLines = rows.map((row, idx) =>
    columns
      .map((col) => {
        if (col.key === 'stt') return String(idx + 1);
        const val = String(
          (row as unknown as Record<string, unknown>)[col.key] ?? ''
        );
        return escapeCsvField(val);
      })
      .join(',')
  );

  return '\uFEFF' + [headerLine, ...dataLines].join('\r\n');
}

/**
 * Triggers a browser file download cleanly (Section 117)
 */
export function triggerBrowserDownload(
  blob: Blob,
  filename: string
): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}

/**
 * Export School Preliminary Review & Forwarding Lists (Prompt S3 Section 77, 78)
 */
export function exportSchoolApplicationsList(params: {
  title: string;
  filenamePrefix: string;
  applications: StaffApplicationRecord[];
  reviewUnitName: string;
}): void {
  const { title, filenamePrefix, applications, reviewUnitName } = params;

  const escapeCsv = (val: string | number | undefined | null): string => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = [
    'STT',
    'Họ và tên',
    'MSSV',
    'Mã hồ sơ',
    'Đơn vị đào tạo',
    'Đơn vị xét sơ',
    'Năm học',
    'Ngày nộp',
    'Tiến độ xét sơ (05 tiêu chí)',
    'Trạng thái xét sơ',
    'Kết quả đề xuất',
    'Nhận xét / Lý do đề xuất',
    'Ngày đề xuất',
    'Ngày chuyển cấp ĐHĐN',
  ];

  const rows = applications.map((app, idx) => {
    const isRecommended =
      app.schoolPreliminaryStatus === 'recommended_forwarding' ||
      app.schoolReviewSummary?.recommendation === 'recommended';
    const isNotRecommended =
      app.schoolPreliminaryStatus === 'not_recommended' ||
      app.schoolReviewSummary?.recommendation === 'not_recommended';
    const isForwarded =
      app.schoolPreliminaryStatus === 'forwarded_to_city' ||
      app.schoolReviewSummary?.isForwardedToCity;

    const recResult = isForwarded
      ? 'Đã chuyển cấp ĐHĐN'
      : isRecommended
      ? 'Đề xuất chuyển cấp ĐHĐN'
      : isNotRecommended
      ? 'Không đề xuất chuyển'
      : 'Chờ kết luận đề xuất';

    const note = isNotRecommended
      ? app.schoolReviewSummary?.notRecommendedReason || ''
      : app.schoolReviewSummary?.officerNotes || '';

    const recDate = app.schoolReviewSummary?.recommendationDate || app.schoolReviewSummary?.preliminaryCompletedAt || '';
    const fwdDate = app.schoolReviewSummary?.forwardedAt || '';

    return [
      String(idx + 1),
      app.student.fullName,
      app.student.studentCode,
      app.applicationId,
      app.institution.officialName,
      reviewUnitName,
      app.schoolYear,
      app.submittedAt,
      `${app.reviewedCriteriaCount}/5 tiêu chí`,
      app.schoolPreliminaryStatus || 'Chờ tiếp nhận',
      recResult,
      note,
      recDate,
      fwdDate,
    ]
      .map(escapeCsv)
      .join(',');
  });

  const csvContent =
    '\uFEFF' +
    [
      `# ${title} - ${reviewUnitName}`,
      headers.map(escapeCsv).join(','),
      ...rows,
    ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
  triggerBrowserDownload(blob, filename);
}

