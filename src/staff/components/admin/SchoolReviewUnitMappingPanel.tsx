/**
 * 5TOT Đà Nẵng — School Review Unit Mapping Panel (Phân tuyến Đơn vị xét sơ tuyển cấp Trường)
 * Extracted subcomponent for InstitutionManagement.tsx to keep file size modular (<1,000 lines).
 *
 * Enforces ADMIN-REVAMP Section 9:
 * - 8 UDN member schools (DUT, DUE, UED, UFL, UTE, VKU, VNUK, SMP) map to `unit-udn`
 * - One forwarding batch per School Review Unit per season
 * - Student original institution identity remains distinct
 */

import React from 'react';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { Institution, SchoolReviewUnitConfig } from '../../adminTypes';
import { INITIAL_SCHOOL_REVIEW_UNITS } from '../../fixtures/adminDataset';
import { validateSchoolReviewUnitMapping } from '../../adminSelectors';

export interface SchoolReviewUnitMappingPanelProps {
  institutions: Institution[];
  schoolReviewUnits?: SchoolReviewUnitConfig[];
  onUpdateSchoolReviewUnit?: (
    unitId: string,
    updates: Partial<SchoolReviewUnitConfig>,
    reason?: string
  ) => void;
}

export const SchoolReviewUnitMappingPanel: React.FC<
  SchoolReviewUnitMappingPanelProps
> = ({ institutions, schoolReviewUnits, onUpdateSchoolReviewUnit }) => {
  const units =
    schoolReviewUnits && schoolReviewUnits.length > 0
      ? schoolReviewUnits
      : INITIAL_SCHOOL_REVIEW_UNITS;

  const mappingValidation = validateSchoolReviewUnitMapping(institutions, units);

  return (
    <div
      data-testid="school-review-unit-mapping-panel"
      className="bg-white rounded-[12px] border border-[#D4E2EC] p-5 shadow-2xs space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF4F8] pb-3">
        <div>
          <div className="flex items-center gap-2 text-[#0D78AE] text-[12px] font-extrabold uppercase tracking-[0.04em]">
            <Building2 size={15} />
            <span>
              Phân tuyến Đơn vị xét sơ tuyển cấp Trường (School Review Units)
            </span>
          </div>
          <p className="text-[12px] text-[#526B7C] mt-0.5">
            Mỗi trường/đơn vị đào tạo thành viên Đại học Đà Nẵng (09 đơn vị) có
            01 Hội đồng Sơ tuyển cấp Trường độc lập (01 đợt trình danh sách/mùa)
            lập tờ trình đề nghị lên Hội Sinh viên Đại học Đà Nẵng.
          </p>
        </div>

        <div
          className={`px-3 py-1 rounded-[8px] border text-[11.5px] font-bold flex items-center gap-1.5 ${
            mappingValidation.isValid
              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#136F3A]'
              : 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]'
          }`}
        >
          {mappingValidation.isValid ? (
            <>
              <CheckCircle2 size={14} />
              <span>
                Phân tuyến hợp lệ ({mappingValidation.udnMemberCount}/9 đơn vị
                thành viên ĐHĐN)
              </span>
            </>
          ) : (
            <>
              <AlertTriangle size={14} />
              <span>Phát hiện lỗi phân tuyến</span>
            </>
          )}
        </div>
      </div>

      {!mappingValidation.isValid && (
        <div className="p-3 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-[12px] text-[#B91C1C] space-y-1">
          {mappingValidation.errors.map((err, i) => (
            <div key={i}>• {err}</div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-[12px]">
        {units.map((unit) => {
          const isUdn = true;
          return (
            <div
              key={unit.id}
              className={`p-3.5 rounded-[10px] border flex flex-col justify-between gap-2.5 ${
                isUdn
                  ? 'bg-[#F0F9FF] border-[#BAE6FD]'
                  : 'bg-[#F8FBFD] border-[#DCE7EE]'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10.5px] font-mono font-extrabold bg-white border border-[#DCE7EE] text-[#0D78AE]">
                    {unit.id}
                  </span>
                  <span className="text-[10.5px] font-bold text-[#136F3A]">
                    Tối đa {unit.maxForwardingBatchesPerSeason} đợt gửi/mùa
                  </span>
                </div>

                <div className="font-extrabold text-[#0F2335] text-[13px]">
                  {unit.officialName}
                </div>

                <div className="text-[11px] text-[#526B7C]">
                  Trường trực thuộc ({(unit.memberInstitutionCodes || unit.memberInstitutionIds || []).length}):{' '}
                  <strong className="text-[#172A3A]">
                    {(unit.memberInstitutionCodes || unit.memberInstitutionIds || []).join(', ')}
                  </strong>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E2EDF5] flex items-center justify-between text-[11px]">
                <span className="text-[#526B7C] flex items-center gap-1">
                  <ShieldCheck size={12} className="text-[#0D78AE]" />
                  <span>
                    {unit.assignedOfficerCount} cán bộ sơ tuyển gán quyền
                  </span>
                </span>
                {onUpdateSchoolReviewUnit && !isUdn && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSchoolReviewUnit(
                        unit.id,
                        { isActive: !unit.isActive },
                        'Cập nhật trạng thái đơn vị xét sơ tuyển'
                      )
                    }
                    className="font-bold text-[#0D78AE] hover:underline cursor-pointer"
                  >
                    {unit.isActive ? 'Đang bật' : 'Tạm ngưng'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
