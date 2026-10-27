/**
 * 5TOT ĐHĐN — Collective Criteria (TT01–TT04) & Dry-Run Evaluator Panel
 * Extracted subcomponent for CriteriaManagement.tsx to keep file size modular (<1,000 lines).
 */

import React, { useState } from 'react';
import { Users, Play, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  CollectiveCriterionConfigItem,
  CriteriaVersion,
} from '../../adminTypes';
import { INITIAL_COLLECTIVE_CRITERIA_CONFIG } from '../../fixtures/adminDataset';
import { evaluateCriteriaDryRun } from '../../adminSelectors';
import { Button } from '../../../components/buttons/Button';

export interface CriteriaCollectiveAndDryRunPanelProps {
  selectedVersion: CriteriaVersion;
  isDraftEditable: boolean;
  collectiveCriteria: CollectiveCriterionConfigItem[];
  onChangeCollectiveCriteria: (next: CollectiveCriterionConfigItem[]) => void;
}

export const CriteriaCollectiveAndDryRunPanel: React.FC<
  CriteriaCollectiveAndDryRunPanelProps
> = ({
  selectedVersion,
  isDraftEditable,
  collectiveCriteria,
  onChangeCollectiveCriteria,
}) => {
  const [dryRunTrack, setDryRunTrack] = useState<'INDIVIDUAL' | 'COLLECTIVE'>(
    'COLLECTIVE'
  );
  const [dryRunInput, setDryRunInput] = useState({
    gpa: 3.45,
    conductPoints: 90,
    peGrade: 'A',
    volunteerDays: 7,
    totalMembers: 45,
    registeredStudentCount: 45,
    schoolLevel5TotCount: 11,
    collectiveActivityCount: 2,
    hasDisciplinaryViolation: false,
  });

  const items =
    collectiveCriteria && collectiveCriteria.length > 0
      ? collectiveCriteria
      : INITIAL_COLLECTIVE_CRITERIA_CONFIG;

  const dryRunResult = evaluateCriteriaDryRun(selectedVersion, {
    track: dryRunTrack,
    ...dryRunInput,
  });

  return (
    <div className="space-y-5">
      {/* 1. Collective Criteria TT01–TT04 Section */}
      <div
        data-testid="collective-criteria-tt01-tt04-panel"
        className="bg-white rounded-[12px] border border-[#D4E2EC] p-5 shadow-2xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EEF4F8] pb-3">
          <div>
            <div className="flex items-center gap-2 text-[#0D78AE] text-[12px] font-extrabold uppercase tracking-[0.04em]">
              <Users size={15} />
              <span>
                Khung tiêu chuẩn Tập thể &ldquo;Sinh viên 5 Tốt&rdquo; cấp Thành
                phố (TT01–TT04)
              </span>
            </div>
            <p className="text-[12px] text-[#526B7C] mt-0.5">
              Hồ sơ Tập thể nộp trực tiếp lên cấp Đại học Đà Nẵng (nhánh T04). Hai
              tiêu chuẩn TT02 (100%) và TT03 (≥ 20%) dùng chung mẫu số{' '}
              <strong>Tổng số sinh viên của tập thể (totalMembers)</strong>.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-[#EBF6FC] text-[#0D78AE] border border-[#CCE7F6]">
            4/4 tiêu chuẩn bắt buộc (AND)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-[12.5px]">
          {items.map((item, idx) => (
            <div
              key={item.code}
              className="p-3.5 rounded-[10px] bg-[#F8FBFD] border border-[#DCE7EE] space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#0D78AE] text-white">
                  {item.code}
                </span>
                <span className="text-[11px] font-bold text-[#136F3A]">
                  Ngưỡng chuẩn: {item.thresholdValue} {item.thresholdUnit}
                </span>
              </div>
              <div className="font-extrabold text-[#0F2335] text-[13.5px]">
                {item.titleVi}
              </div>
              <p className="text-[12px] text-[#526B7C]">{item.descriptionVi}</p>

              {isDraftEditable && (item.code === 'TT02' || item.code === 'TT03') && (
                <div className="pt-2 border-t border-[#E2EDF5] flex items-center justify-between gap-2">
                  <label className="text-[11.5px] font-semibold text-[#172A3A]">
                    Ngưỡng tỷ lệ tối thiểu (% trên totalMembers):
                  </label>
                  <input
                    type="number"
                    min={item.code === 'TT02' ? 100 : 20}
                    max={100}
                    value={item.thresholdValue}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const next = items.map((c, i) =>
                        i === idx ? { ...c, thresholdValue: val } : c
                      );
                      onChangeCollectiveCriteria(next);
                    }}
                    className="w-[80px] h-[32px] px-2 text-right font-bold bg-white border border-[#DCE7EE] rounded-[6px]"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Advisory Dry-Run Rule Evaluator ("Kiểm tra thử quy tắc") */}
      <div
        data-testid="criteria-dry-run-evaluator"
        className="bg-white rounded-[12px] border border-[#D4E2EC] p-5 shadow-2xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF4F8] pb-3">
          <div>
            <h3 className="text-[14px] font-extrabold text-[#0F2335] flex items-center gap-2">
              <Play size={15} className="text-[#0D78AE]" />
              <span>
                Kiểm tra thử quy tắc trên dữ liệu mẫu (Dry-run Advisory)
              </span>
            </h3>
            <p className="text-[12px] text-[#526B7C] mt-0.5">
              Mô phỏng kết quả gợi ý đối chiếu tiêu chuẩn trước khi áp dụng cho
              mùa xét (không thay thế quyết định thẩm định của Cán bộ/Hội đồng).
            </p>
          </div>

          <div className="inline-flex rounded-[8px] p-0.5 bg-[#F1F5F9] text-[12px] font-bold">
            <button
              type="button"
              onClick={() => setDryRunTrack('COLLECTIVE')}
              className={`px-3 py-1 rounded-[6px] cursor-pointer ${
                dryRunTrack === 'COLLECTIVE'
                  ? 'bg-white text-[#0D78AE] shadow-xs'
                  : 'text-[#526B7C]'
              }`}
            >
              Thử hồ sơ Tập thể (TT01–TT04)
            </button>
            <button
              type="button"
              onClick={() => setDryRunTrack('INDIVIDUAL')}
              className={`px-3 py-1 rounded-[6px] cursor-pointer ${
                dryRunTrack === 'INDIVIDUAL'
                  ? 'bg-white text-[#0D78AE] shadow-xs'
                  : 'text-[#526B7C]'
              }`}
            >
              Thử hồ sơ Cá nhân (05 Tiêu chuẩn)
            </button>
          </div>
        </div>

        {dryRunTrack === 'COLLECTIVE' ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-[12px]">
            <div>
              <label className="font-bold text-[#172A3A] block mb-1">
                Tổng SV tập thể (totalMembers)
              </label>
              <input
                type="number"
                min={1}
                value={dryRunInput.totalMembers}
                onChange={(e) =>
                  setDryRunInput({
                    ...dryRunInput,
                    totalMembers: Number(e.target.value),
                  })
                }
                className="w-full h-[36px] px-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[6px] font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-[#172A3A] block mb-1">
                SV đăng ký SV5T (TT02)
              </label>
              <input
                type="number"
                min={0}
                value={dryRunInput.registeredStudentCount}
                onChange={(e) =>
                  setDryRunInput({
                    ...dryRunInput,
                    registeredStudentCount: Number(e.target.value),
                  })
                }
                className="w-full h-[36px] px-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[6px] font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-[#172A3A] block mb-1">
                SV đạt SV5T cấp Trường (TT03)
              </label>
              <input
                type="number"
                min={0}
                value={dryRunInput.schoolLevel5TotCount}
                onChange={(e) =>
                  setDryRunInput({
                    ...dryRunInput,
                    schoolLevel5TotCount: Number(e.target.value),
                  })
                }
                className="w-full h-[36px] px-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[6px] font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-[#172A3A] block mb-1">
                Số hoạt động chủ đề (TT01)
              </label>
              <input
                type="number"
                min={0}
                value={dryRunInput.collectiveActivityCount}
                onChange={(e) =>
                  setDryRunInput({
                    ...dryRunInput,
                    collectiveActivityCount: Number(e.target.value),
                  })
                }
                className="w-full h-[36px] px-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[6px] font-bold"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 font-bold text-[#172A3A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={dryRunInput.hasDisciplinaryViolation}
                  onChange={(e) =>
                    setDryRunInput({
                      ...dryRunInput,
                      hasDisciplinaryViolation: e.target.checked,
                    })
                  }
                />
                <span>Có SV bị kỷ luật (TT04)</span>
              </label>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
            <div>
              <label className="font-bold text-[#172A3A] block mb-1">
                Điểm rèn luyện (Đạo đức)
              </label>
              <input
                type="number"
                value={dryRunInput.conductPoints}
                onChange={(e) =>
                  setDryRunInput({
                    ...dryRunInput,
                    conductPoints: Number(e.target.value),
                  })
                }
                className="w-full h-[36px] px-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[6px] font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-[#172A3A] block mb-1">
                GPA tích lũy /4.0 (Học tập)
              </label>
              <input
                type="number"
                step="0.05"
                value={dryRunInput.gpa}
                onChange={(e) =>
                  setDryRunInput({
                    ...dryRunInput,
                    gpa: Number(e.target.value),
                  })
                }
                className="w-full h-[36px] px-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[6px] font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-[#172A3A] block mb-1">
                Điểm GDTC (Thể lực)
              </label>
              <select
                value={dryRunInput.peGrade}
                onChange={(e) =>
                  setDryRunInput({ ...dryRunInput, peGrade: e.target.value })
                }
                className="w-full h-[36px] px-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[6px] font-bold"
              >
                <option value="A">Đạt điểm A</option>
                <option value="B">Điểm B</option>
                <option value="C">Điểm C</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-[#172A3A] block mb-1">
                Số ngày tình nguyện/năm
              </label>
              <input
                type="number"
                value={dryRunInput.volunteerDays}
                onChange={(e) =>
                  setDryRunInput({
                    ...dryRunInput,
                    volunteerDays: Number(e.target.value),
                  })
                }
                className="w-full h-[36px] px-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[6px] font-bold"
              />
            </div>
          </div>
        )}

        {/* Dry-Run Evaluation Result */}
        <div
          className={`p-3.5 rounded-[10px] border text-[12px] space-y-2 ${
            dryRunResult.advisoryPassed
              ? 'bg-[#F0FDF4] border-[#BBF7D0]'
              : 'bg-[#FEF2F2] border-[#FECACA]'
          }`}
        >
          <div className="flex items-center gap-2 font-extrabold text-[#0F2335]">
            {dryRunResult.advisoryPassed ? (
              <CheckCircle2 size={16} className="text-[#16A34A]" />
            ) : (
              <AlertTriangle size={16} className="text-[#DC2626]" />
            )}
            <span>{dryRunResult.summaryVi}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {dryRunResult.breakdown.map((b) => (
              <div
                key={b.code}
                className="p-2 rounded bg-white border border-[#E2EDF5] flex items-center justify-between gap-2"
              >
                <div>
                  <span className="font-bold text-[#0F2335]">
                    {b.code} — {b.titleVi}:
                  </span>{' '}
                  <span className="text-[#526B7C]">{b.reasonVi}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10.5px] font-bold shrink-0 ${
                    b.passed
                      ? 'bg-[#ECFDF5] text-[#136F3A]'
                      : 'bg-[#FEF2F2] text-[#B91C1C]'
                  }`}
                >
                  {b.passed ? 'Đạt ngưỡng' : 'Chưa đạt'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
