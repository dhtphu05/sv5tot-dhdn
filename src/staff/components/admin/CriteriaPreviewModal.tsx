/**
 * 5TOT ĐHĐN — Student Interface Preview Modal for Admin
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 21 Section 65 & 66:
 * - Read-only student-facing preview of the 5 criteria configuration.
 * - Confirms that Admin and Student share the exact same CriterionDefinition structure.
 */

import React, { useState } from 'react';
import { X, Info } from 'lucide-react';
import { CriterionDefinitionData } from '../../../demo/fixtures/criteriaDefinitions';
import { Button } from '../../../components/buttons/Button';

export interface CriteriaPreviewModalProps {
  versionTitle: string;
  versionCode: string;
  criteria: Record<string, CriterionDefinitionData>;
  onClose: () => void;
}

export const CriteriaPreviewModal: React.FC<CriteriaPreviewModalProps> = ({
  versionTitle,
  versionCode,
  criteria,
  onClose,
}) => {
  const [activeCritKey, setActiveCritKey] = useState<string>('ethics');

  const criteriaList = Object.values(criteria).sort((a, b) => a.number - b.number);
  const activeCriterion = criteria[activeCritKey] || criteriaList[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-[14px] border border-[#D4E2EC] max-w-[1040px] w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#EEF4F8] flex items-center justify-between gap-3 bg-[#F8FBFD]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EBF6FC] text-[#0D78AE] border border-[#CCE7F6]">
                Chế độ xem trước sinh viên
              </span>
              <span className="text-[12px] font-semibold text-[#526B7C]">
                {versionCode}
              </span>
            </div>
            <h2 className="text-[16px] font-extrabold text-[#0F2335] mt-0.5">
              {versionTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#607483] hover:text-[#0F2335] rounded-[8px] hover:bg-[#F2F8FC]"
          >
            <X size={18} />
          </button>
        </div>

        {/* 5 Criteria Tabs */}
        <div className="flex border-b border-[#EEF4F8] px-5 bg-white overflow-x-auto">
          {criteriaList.map((crit) => {
            const isActive = activeCritKey === crit.id;
            return (
              <button
                key={crit.id}
                type="button"
                onClick={() => setActiveCritKey(crit.id)}
                className={`py-3 px-4 text-[13px] font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'border-[#0D78AE] text-[#0D78AE]'
                    : 'border-transparent text-[#526B7C] hover:text-[#0F2335]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-extrabold ${
                    isActive
                      ? 'bg-[#0D78AE] text-white'
                      : 'bg-[#F1F5F9] text-[#64748B]'
                  }`}
                >
                  {crit.number}
                </span>
                <span>{crit.name}</span>
              </button>
            );
          })}
        </div>

        {/* Body Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#F4F8FB]">
          <div className="p-4 rounded-[10px] bg-white border border-[#DCE7EE] shadow-2xs">
            <h3 className="text-[16px] font-extrabold text-[#0F2335]">
              {activeCriterion.vietnameseTitle}
            </h3>
            <p className="text-[13px] text-[#526B7C] mt-1">
              {activeCriterion.shortSummary}
            </p>
          </div>

          {/* Groups List */}
          <div className="space-y-4">
            {activeCriterion.groups.map((group, gIdx) => (
              <div
                key={group.id}
                className="bg-white rounded-[12px] border border-[#DCE7EE] overflow-hidden shadow-2xs"
              >
                <div className="px-4 py-3 bg-[#F8FBFD] border-b border-[#DCE7EE] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-extrabold text-[#526B7C] uppercase tracking-[0.04em]">
                      Nhóm {gIdx + 1}:
                    </span>
                    <h4 className="text-[14px] font-extrabold text-[#0F2335]">
                      {group.title}
                    </h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-[5px] text-[11.5px] font-bold bg-[#EBF6FC] text-[#0D78AE] border border-[#CCE7F6]">
                    {group.ruleBadge}
                  </span>
                </div>

                <div className="divide-y divide-[#EEF4F8]">
                  {group.requirements.map((req) => (
                    <div key={req.id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.2 rounded text-[11px] font-bold bg-[#F1F5F9] text-[#475569] font-mono">
                              {req.code}
                            </span>
                            <span className="font-extrabold text-[#172A3A] text-[13.5px]">
                              {req.title}
                            </span>
                          </div>
                          {req.ruleHelper && (
                            <p className="text-[12px] text-[#526B7C]">
                              {req.ruleHelper}
                            </p>
                          )}
                        </div>

                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F8FBFD] border border-[#DCE7EE] text-[#526B7C] shrink-0">
                          {req.declarationMultiplicity === 'SINGLE'
                            ? 'Một kê khai'
                            : 'Có thể kê khai nhiều nội dung'}
                        </span>
                      </div>

                      {req.regulationSnippet && (
                        <div className="p-2.5 rounded-[6px] bg-[#F8FBFD] border border-[#E2EDF5] text-[11.5px] text-[#526B7C] flex items-start gap-2">
                          <Info size={14} className="text-[#0D78AE] shrink-0 mt-0.5" />
                          <span>{req.regulationSnippet}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#EEF4F8] bg-white flex items-center justify-between">
          <span className="text-[12px] text-[#526B7C]">
            Khung tiêu chí hiển thị trực quan giống 100% không gian làm việc của
            Sinh viên.
          </span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Đóng xem trước
          </Button>
        </div>
      </div>
    </div>
  );
};
