/**
 * 5TOT ĐHĐN — Development Domain Audit Matrix View
 * Development-only inspector listing all 5 criteria, requirement groups, and requirements.
 * Implements Prompt Section 9, 36, 45:
 * - Shows: criterion, group, requirement code & title, group minimum, SINGLE / MULTIPLE,
 *   current declaration count, add-action label, and evidence policy.
 * - This view is for internal developer verification and audit only.
 * - Kept strictly inside Design System / Dev Playground and never in the student production UI.
 */

import React, { useState } from 'react';
import { CRITERIA_DEFINITIONS_LIST, RequirementDefinition, resolveMultiplicity } from '../../demo/fixtures/criteriaDefinitions';
import { INITIAL_STUDENT_APPLICATION, StudentApplicationData } from '../../demo/fixtures/studentApplication';
import { CRITERIA } from '../../tokens';
import { Layers, CheckCircle2, AlertCircle, Info, Database, Filter, Eye } from 'lucide-react';

export interface DomainAuditDevViewProps {
  applicationData?: StudentApplicationData;
  className?: string;
}

export const DomainAuditDevView: React.FC<DomainAuditDevViewProps> = ({
  applicationData = INITIAL_STUDENT_APPLICATION,
  className = '',
}) => {
  const [filterCriterion, setFilterCriterion] = useState<string>('all');
  const [filterMultiplicity, setFilterMultiplicity] = useState<'all' | 'SINGLE' | 'MULTIPLE'>('all');

  // Flatten all requirements with their criterion, group, and live application counts
  const auditRows = CRITERIA_DEFINITIONS_LIST.flatMap((critDef) => {
    const liveCrit = applicationData.criteria.find((c) => c.id === critDef.id);

    return critDef.groups.flatMap((grpDef) => {
      const liveGrp = liveCrit?.groups.find((g) => g.id === grpDef.id);

      return grpDef.requirements.map((reqDef) => {
        const liveReq =
          liveGrp?.requirements.find((r) => r.id === reqDef.id) ||
          liveCrit?.requirements.find((r) => r.id === reqDef.id);

        const declCount = liveReq?.declarations?.length || 0;
        const evCount =
          liveReq?.declarations?.reduce((sum, d) => sum + (d.evidenceFiles?.length || 0), 0) || 0;

        return {
          criterionId: critDef.id,
          criterionNumber: critDef.number,
          criterionName: critDef.name,
          groupId: grpDef.id,
          groupTitle: grpDef.title,
          groupType: grpDef.groupType,
          groupRuleBadge: grpDef.ruleBadge,
          minSelections: grpDef.minSelections ?? grpDef.minApplicable ?? 1,
          reqId: reqDef.id,
          reqCode: reqDef.code,
          reqTitle: reqDef.title,
          multiplicity: resolveMultiplicity(reqDef.declarationMultiplicity),
          declarationLabel: reqDef.declarationLabel,
          addActionLabel: reqDef.addActionLabel || (resolveMultiplicity(reqDef.declarationMultiplicity) === 'MULTIPLE' ? '+ Thêm kê khai' : 'Kê khai nội dung này'),
          allowMultipleEvidence: reqDef.allowMultipleEvidence ?? true,
          liveDeclCount: declCount,
          liveEvCount: evCount,
          isDeclared: declCount > 0,
          status: liveReq?.status || 'undeclared',
        };
      });
    });
  });

  const filteredRows = auditRows.filter((row) => {
    if (filterCriterion !== 'all' && row.criterionId !== filterCriterion) return false;
    if (filterMultiplicity !== 'all' && row.multiplicity !== filterMultiplicity) return false;
    return true;
  });

  const totalReqs = auditRows.length;
  const singleCount = auditRows.filter((r) => r.multiplicity === 'SINGLE').length;
  const multiCount = auditRows.filter((r) => r.multiplicity === 'MULTIPLE').length;
  const declaredReqsCount = auditRows.filter((r) => r.isDeclared).length;

  return (
    <div className={`flex flex-col gap-6 text-[#172A3A] ${className}`}>
      {/* Top Header Card */}
      <div className="p-5 bg-white rounded-[14px] border border-[#DCE7EE] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-[7px] bg-[#EAF6FC] text-[#0D78AE]">
              <Database size={16} />
            </span>
            <h3 className="text-[16px] font-bold text-[#172A3A]">
              Bảng kiểm toán cấu trúc 5 Tiêu chí (Five-Criteria Domain Audit Matrix)
            </h3>
          </div>
          <p className="text-[12.5px] text-[#607483] max-w-2xl leading-relaxed">
            Công cụ phát triển chuẩn hóa hệ thống phân cấp: Tiêu chí (5) ➔ Nhóm tiêu chuẩn ➔ Tiêu chuẩn xét chọn ➔ Kê khai sinh viên (0..n) ➔ Minh chứng (0..n).
          </p>
        </div>

        {/* Aggregate KPI chips */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-3 py-2 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[9px] text-center min-w-[85px]">
            <span className="text-[11px] font-semibold text-[#607483] block">Tổng số tiêu chuẩn</span>
            <span className="text-[16px] font-extrabold text-[#172A3A]">{totalReqs}</span>
          </div>
          <div className="px-3 py-2 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[9px] text-center min-w-[85px]">
            <span className="text-[11px] font-semibold text-[#15803D] block">MULTIPLE (0..n)</span>
            <span className="text-[16px] font-extrabold text-[#15803D]">{multiCount}</span>
          </div>
          <div className="px-3 py-2 bg-[#EFF6FF] border border-[#BFDBFE] rounded-[9px] text-center min-w-[85px]">
            <span className="text-[11px] font-semibold text-[#1D4ED8] block">SINGLE (0..1)</span>
            <span className="text-[16px] font-extrabold text-[#1D4ED8]">{singleCount}</span>
          </div>
          <div className="px-3 py-2 bg-[#FEF9F0] border border-[#FADDB6] rounded-[9px] text-center min-w-[85px]">
            <span className="text-[11px] font-semibold text-[#B75B00] block">Đã có kê khai</span>
            <span className="text-[16px] font-extrabold text-[#B75B00]">{declaredReqsCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-[#FFFFFF] p-3 rounded-[10px] border border-[#DCE7EE]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12px] font-bold text-[#607483] flex items-center gap-1">
            <Filter size={13} />
            <span>Lọc theo tiêu chí:</span>
          </span>
          <select
            value={filterCriterion}
            onChange={(e) => setFilterCriterion(e.target.value)}
            className="text-[12px] font-semibold bg-[#F8FBFD] border border-[#DCE7EE] rounded-[7px] px-2.5 py-1 text-[#172A3A] outline-none cursor-pointer"
          >
            <option value="all">Tất cả 5 tiêu chí</option>
            <option value="ethics">1. Đạo đức tốt</option>
            <option value="academic">2. Học tập tốt</option>
            <option value="physical">3. Thể lực tốt</option>
            <option value="volunteer">4. Tình nguyện tốt</option>
            <option value="integration">5. Hội nhập tốt</option>
          </select>

          <span className="text-[12px] font-bold text-[#607483] ml-2">Đặc tính kê khai:</span>
          <select
            value={filterMultiplicity}
            onChange={(e) => setFilterMultiplicity(e.target.value as any)}
            className="text-[12px] font-semibold bg-[#F8FBFD] border border-[#DCE7EE] rounded-[7px] px-2.5 py-1 text-[#172A3A] outline-none cursor-pointer"
          >
            <option value="all">Tất cả (SINGLE & MULTIPLE)</option>
            <option value="SINGLE">Chỉ SINGLE (Kê khai 0..1)</option>
            <option value="MULTIPLE">Chỉ MULTIPLE (Kê khai 0..n)</option>
          </select>
        </div>

        <span className="text-[11.5px] text-[#728391] font-medium">
          Hiển thị <strong>{filteredRows.length}</strong> / {totalReqs} tiêu chuẩn
        </span>
      </div>

      {/* Audit Matrix Table */}
      <div className="bg-white rounded-[14px] border border-[#DCE7EE] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-[#F8FBFD] border-b border-[#DCE7EE] text-[11px] font-bold text-[#607483] uppercase tracking-wider">
                <th className="py-3 px-4 w-[160px]">Tiêu chí & Nhóm</th>
                <th className="py-3 px-4 w-[80px]">Mã</th>
                <th className="py-3 px-4 min-w-[220px]">Tiêu chuẩn xét chọn</th>
                <th className="py-3 px-4 w-[130px]">Quy tắc nhóm</th>
                <th className="py-3 px-4 w-[110px]">Đặc tính</th>
                <th className="py-3 px-4 min-w-[190px]">Nút hành động thêm</th>
                <th className="py-3 px-4 w-[120px] text-center">Minh chứng</th>
                <th className="py-3 px-4 w-[120px] text-right">Kê khai demo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBF1F5]">
              {filteredRows.map((row) => {
                const critToken = CRITERIA[row.criterionId as keyof typeof CRITERIA];
                const isMulti = row.multiplicity === 'MULTIPLE';

                return (
                  <tr key={row.reqId} className="hover:bg-[#F9FBFC] transition-colors">
                    {/* Criterion & Group */}
                    <td className="py-3 px-4 align-top">
                      <div className="flex items-center gap-1.5 font-bold text-[12px] text-[#172A3A]">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: critToken?.accentColor || '#18A6E0' }}
                        />
                        <span>{row.criterionName}</span>
                      </div>
                      <div className="text-[11px] text-[#607483] mt-0.5 truncate max-w-[150px]" title={row.groupTitle}>
                        {row.groupTitle}
                      </div>
                    </td>

                    {/* Code */}
                    <td className="py-3 px-4 align-top font-bold text-[#0D78AE]">
                      {row.reqCode}
                    </td>

                    {/* Requirement Title */}
                    <td className="py-3 px-4 align-top">
                      <span className="font-bold text-[#172A3A] block leading-snug">
                        {row.reqTitle}
                      </span>
                      <span className="text-[11px] text-[#728391] mt-0.5 block">
                        Nhãn kê khai: <em>{row.declarationLabel}</em>
                      </span>
                    </td>

                    {/* Group Rule & Minimum */}
                    <td className="py-3 px-4 align-top">
                      <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-[5px] bg-[#F1F6F9] text-[#466474] border border-[#E3EBF1]">
                        {row.groupRuleBadge}
                      </span>
                      <span className="text-[10.5px] text-[#728391] block mt-0.5">
                        Tối thiểu: <strong>{row.minSelections}</strong>
                      </span>
                    </td>

                    {/* Multiplicity Badge */}
                    <td className="py-3 px-4 align-top">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-[6px] border ${
                          isMulti
                            ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                            : 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
                        }`}
                      >
                        {isMulti ? (
                          <>
                            <Layers size={11} />
                            <span>MULTIPLE</span>
                          </>
                        ) : (
                          <span>SINGLE</span>
                        )}
                      </span>
                      <span className="text-[10.5px] text-[#607483] block mt-0.5">
                        {isMulti ? 'Cho phép 0..n' : 'Tối đa 01'}
                      </span>
                    </td>

                    {/* Add Action Label */}
                    <td className="py-3 px-4 align-top">
                      <span className="inline-block font-mono text-[11.5px] font-semibold text-[#126A9C] bg-[#EAF6FC] px-2 py-0.5 rounded-[5px] border border-[#D0E8F5]">
                        {row.addActionLabel}
                      </span>
                    </td>

                    {/* Evidence Policy */}
                    <td className="py-3 px-4 align-top text-center">
                      <span className="text-[11px] font-semibold text-[#15803D] bg-[#F0FDF4] px-1.5 py-0.5 rounded-[4px] border border-[#DCFCE7]">
                        Cho phép nhiều
                      </span>
                    </td>

                    {/* Live Demo Count */}
                    <td className="py-3 px-4 align-top text-right">
                      <div className="font-extrabold text-[13px] text-[#172A3A]">
                        {row.liveDeclCount} {row.liveDeclCount > 1 ? 'mục' : 'kê khai'}
                      </div>
                      <div className="text-[11px] text-[#607483]">
                        {row.liveEvCount} minh chứng
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assumptions & Business Rule Ambiguity Notes (Report Section) */}
      <div className="p-4 bg-[#FEF9F0] border border-[#FADDB6] rounded-[12px] space-y-2 text-[12px] text-[#8C3A19] leading-relaxed">
        <div className="flex items-center gap-1.5 font-bold text-[#B75B00] text-[13px]">
          <AlertCircle size={15} />
          <span>Ghi chú giả định kiến trúc & Cần làm rõ quy định thực tế (Audit Notes)</span>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-[#92400E]">
          <li>
            <strong>GPA & Điểm rèn luyện:</strong> Được cấu hình là <code>SINGLE</code> vì đại diện cho kết quả tích lũy duy nhất trong cả năm học xét chọn.
          </li>
          <li>
            <strong>Nghiên cứu khoa học (NCKH) & Thành tích thể thao:</strong> Được cấu hình là <code>MULTIPLE</code>. Đã cập nhật demo fixture với 2 thành tích nghiên cứu độc lập (Giải Nhì NCKH 2026 + Đề tài cấp trường) và 2 thành tích thể thao độc lập (Huy chương Bạc bóng chuyền + Giải Ba bóng đá) với các tệp minh chứng riêng biệt thuộc quyền sở hữu của từng kê khai.
          </li>
          <li>
            <strong>Nhóm thể lực (Cần ít nhất 1 trong 2 hình thức):</strong> Quy tắc <em>"đạt một trong hai"</em> được xem là điều kiện <em>TỐI THIỂU</em> (minSelections = 1). Sinh viên có thể kê khai cả hai hình thức (Sinh viên khỏe + Thành tích thể thao) để Hội đồng đối chiếu, không bị ẩn hoặc giới hạn.
          </li>
          <li>
            <strong>Chứng chỉ ngoại ngữ (Tiêu chí 5):</strong> Được cấu hình hỗ trợ <code>MULTIPLE</code> để sinh viên có thể lưu trữ và thẩm định cả IELTS, TOEIC hoặc các chứng chỉ quốc tế song hành nếu có.
          </li>
          <li>
            <strong>Tình nguyện tốt:</strong> Hoạt động tình nguyện lưu trữ dưới dạng mảng 0..n kê khai (hiện có 3 hoạt động trong hồ sơ demo: Mùa hè xanh, Chủ nhật xanh, Hiến máu), mỗi hoạt động sở hữu minh chứng riêng.
          </li>
        </ul>
      </div>
    </div>
  );
};
