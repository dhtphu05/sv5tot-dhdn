import React from 'react';
import { Building2 } from 'lucide-react';
import {
  CollectiveRequirementId,
  COLLECTIVE_REQUIREMENTS_META,
} from '../../../staff/collectiveTypes';

export interface CollectiveRequirementNavProps {
  activeReqId: CollectiveRequirementId;
  onSelectReq: (reqId: CollectiveRequirementId) => void;
  getReqStatus: (reqId: CollectiveRequirementId) => { label: string; color: string };
}

export const CollectiveRequirementNav: React.FC<CollectiveRequirementNavProps> = ({
  activeReqId,
  onSelectReq,
  getReqStatus,
}) => {
  return (
    <div className="w-80 shrink-0 flex flex-col gap-2.5 overflow-y-auto">
      <div className="text-[12px] font-bold uppercase tracking-wider text-[#607483] px-1">
        04 Tiêu chuẩn tập thể (2025–2026)
      </div>

      {(['TT01', 'TT02', 'TT03', 'TT04'] as CollectiveRequirementId[]).map((reqId) => {
        const meta = COLLECTIVE_REQUIREMENTS_META[reqId];
        const isSelected = activeReqId === reqId;
        const reqStatus = getReqStatus(reqId);

        return (
          <button
            key={reqId}
            type="button"
            onClick={() => onSelectReq(reqId)}
            className={`w-full text-left p-3.5 rounded-[12px] border transition-all cursor-pointer ${
              isSelected
                ? 'bg-white border-[#0D78AE] shadow-sm ring-2 ring-[#0D78AE]/15'
                : 'bg-white/80 border-[#DCE7EE] hover:bg-white hover:border-[#B8CEDC]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11.5px] font-extrabold text-[#0D78AE] bg-[#EAF6FC] px-2 py-0.5 rounded-[5px]">
                {meta.code}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-[4px] ${reqStatus.color}`}>
                {reqStatus.label}
              </span>
            </div>

            <div className="font-bold text-[13.5px] text-[#172A3A] mt-2 line-clamp-2">
              {meta.shortTitle}
            </div>

            <div className="text-[11.5px] text-[#607483] mt-1 flex items-center justify-between">
              <span>{meta.thresholdHelper}</span>
            </div>
          </button>
        );
      })}

      {/* Institutional Independent Evaluation Scope Card */}
      <div className="mt-auto p-4 bg-white border border-[#DCE7EE] rounded-[12px] text-[12px] space-y-1.5 shadow-2xs">
        <div className="font-bold text-[#172A3A] flex items-center gap-1.5">
          <Building2 size={14} className="text-[#0D78AE]" />
          <span>Cơ chế xét duyệt trực tiếp cấp ĐHĐN</span>
        </div>
        <p className="text-[#607483] leading-relaxed">
          Hồ sơ Tập thể nộp trực tiếp đến Hội Sinh viên Đại học Đà Nẵng để thẩm định độc lập 4 tiêu chuẩn TT01–TT04, không qua khâu duyệt trung gian cấp Trường.
        </p>
      </div>
    </div>
  );
};
