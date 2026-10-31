/**
 * 5TOT ĐHĐN — 5 Criteria Configuration & Versioning Management
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 21 Sections 46–67, 113:
 * - EXACTLY FIVE CANONICAL CRITERIA:
 *   1. Đạo đức tốt
 *   2. Học tập tốt
 *   3. Thể lực tốt
 *   4. Tình nguyện tốt
 *   5. Hội nhập tốt
 * - NO casual 6th criterion creation.
 * - Criteria Versions: 2026–2027 Applied, 2027–2028 Draft, 2025–2026 Archived.
 * - Duplicate previous version -> edit Draft workflow.
 * - 3-pane Editor: Left 5 criteria nav -> Center Groups & Requirements -> Right Inspector.
 * - Multiplicity: SINGLE vs MULTIPLE (MULTIPLE by default).
 * - Group rules: ALL_REQUIRED, AT_LEAST_N, OPTIONAL, REPEATABLE_COLLECTION.
 * - Validation service (checks exactly 5 criteria, valid groups, minimum counts).
 * - "Xem trước giao diện sinh viên" modal.
 */

import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Copy,
  CheckCircle2,
  AlertCircle,
  Eye,
  Save,
  Lock,
  ChevronRight,
  Info,
  X,
  Layers,
  Users,
} from 'lucide-react';
import {
  CollectiveCriterionConfigItem,
  CriteriaVersion,
} from '../../adminTypes';
import {
  CriterionDefinitionData,
  DeclarationMultiplicity,
  RequirementDefinition,
} from '../../../demo/fixtures/criteriaDefinitions';
import { INITIAL_COLLECTIVE_CRITERIA_CONFIG } from '../../fixtures/adminDataset';
import { validateCriteriaVersion } from '../../adminSelectors';
import { Button } from '../../../components/buttons/Button';
import { CriteriaPreviewModal } from './CriteriaPreviewModal';
import { CriteriaCollectiveAndDryRunPanel } from './CriteriaCollectiveAndDryRunPanel';

export interface CriteriaManagementProps {
  criteriaVersions: CriteriaVersion[];
  onCreateCriteriaVersionFromCurrent: (
    sourceId: string,
    newVersionCode: string,
    newTitle: string
  ) => void;
  onSaveCriteriaDraft: (
    versionId: string,
    updatedCriteria: Record<string, CriterionDefinitionData>,
    reason?: string,
    updatedCollectiveCriteria?: CollectiveCriterionConfigItem[]
  ) => void;
  onApplyCriteriaVersion: (versionId: string, reason?: string) => void;
}

export const CriteriaManagement: React.FC<CriteriaManagementProps> = ({
  criteriaVersions,
  onCreateCriteriaVersionFromCurrent,
  onSaveCriteriaDraft,
  onApplyCriteriaVersion,
}) => {
  const [activeTrack, setActiveTrack] = useState<'individual' | 'collective'>(
    'individual'
  );

  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    criteriaVersions.find((v) => v.status === 'draft')?.id ||
      criteriaVersions[0]?.id ||
      ''
  );

  const selectedVersion =
    criteriaVersions.find((v) => v.id === selectedVersionId) ||
    criteriaVersions[0];

  // Working editable copy of criteria
  const [workingCriteria, setWorkingCriteria] = useState<
    Record<string, CriterionDefinitionData>
  >(() => JSON.parse(JSON.stringify(selectedVersion?.criteria || {})));
  const [workingCollectiveCriteria, setWorkingCollectiveCriteria] = useState<
    CollectiveCriterionConfigItem[]
  >(() =>
    JSON.parse(
      JSON.stringify(
        selectedVersion?.collectiveCriteria ||
          INITIAL_COLLECTIVE_CRITERIA_CONFIG
      )
    )
  );

  const [activeCriterionKey, setActiveCriterionKey] =
    useState<string>('academic');
  const [selectedRequirementId, setSelectedRequirementId] = useState<
    string | null
  >('academic-gpa');

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    totalGroups: number;
    totalRequirements: number;
  } | null>(null);

  // Modals state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [duplicateForm, setDuplicateForm] = useState({
    versionCode: 'v1.0 (2026–2027 Draft)',
    title: 'Dự thảo khung tiêu chuẩn Sinh viên 5 Tốt & Tập thể SV5T (Năm học 2026–2027)',
  });

  // When switching version
  const handleSelectVersion = (versionId: string) => {
    const target = criteriaVersions.find((v) => v.id === versionId);
    if (!target) return;
    setSelectedVersionId(versionId);
    setWorkingCriteria(JSON.parse(JSON.stringify(target.criteria)));
    setWorkingCollectiveCriteria(
      JSON.parse(
        JSON.stringify(
          target.collectiveCriteria || INITIAL_COLLECTIVE_CRITERIA_CONFIG
        )
      )
    );
    setHasUnsavedChanges(false);
    setValidationResult(null);
  };

  const activeCriterion = workingCriteria[activeCriterionKey];

  // Selected requirement lookup
  const selectedRequirementInfo = useMemo(() => {
    if (!activeCriterion || !selectedRequirementId) return null;
    for (const group of activeCriterion.groups) {
      const found = group.requirements.find(
        (r) => r.id === selectedRequirementId
      );
      if (found) {
        return { group, requirement: found };
      }
    }
    return null;
  }, [activeCriterion, selectedRequirementId]);

  const isDraft = selectedVersion?.status === 'draft';

  // Update requirement in working copy
  const handleUpdateRequirement = (
    reqId: string,
    updates: Partial<RequirementDefinition>
  ) => {
    if (!isDraft) return;
    setWorkingCriteria((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const crit = next[activeCriterionKey];
      if (!crit) return prev;
      for (const group of crit.groups) {
        const reqIdx = group.requirements.findIndex(
          (r: RequirementDefinition) => r.id === reqId
        );
        if (reqIdx !== -1) {
          group.requirements[reqIdx] = {
            ...group.requirements[reqIdx],
            ...updates,
          };
          break;
        }
      }
      return next;
    });
    setHasUnsavedChanges(true);
  };

  const handleValidate = () => {
    if (!selectedVersion) return;
    const res = validateCriteriaVersion({
      ...selectedVersion,
      criteria: workingCriteria,
      collectiveCriteria: workingCollectiveCriteria,
    });
    setValidationResult(res);
  };

  const handleSaveDraft = () => {
    if (!selectedVersion || !isDraft) return;
    onSaveCriteriaDraft(
      selectedVersion.id,
      workingCriteria,
      'Cập nhật cấu hình bản dự thảo tiêu chí',
      workingCollectiveCriteria
    );
    setHasUnsavedChanges(false);
  };

  return (
    <div className="p-6 max-w-[1360px] w-full mx-auto space-y-5 pb-20">
      {/* 1. Header (Prompt 21 Section 46 & 47) */}
      <div className="border-b border-[#DCE7EE] pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[12px] font-semibold text-[#526B7C]">
            Chuẩn hóa tiêu chuẩn xét chọn · Hội Sinh viên Đại học Đà Nẵng
          </div>
          <h1 className="text-[20px] font-extrabold text-[#0F2335] mt-0.5 flex items-center gap-2">
            <Sliders size={20} className="text-[#0D78AE]" />
            <span>Tiêu chí xét chọn</span>
          </h1>
          <p className="text-[12.5px] text-[#526B7C] mt-1">
            Cấu hình nội dung bên trong đúng <strong>05 tiêu chí chính thức</strong>:
            Đạo đức tốt, Học tập tốt, Thể lực tốt, Tình nguyện tốt và Hội nhập
            tốt.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Eye size={14} />
            <span>Xem trước giao diện sinh viên</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsDuplicateOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Copy size={14} />
            <span>Tạo phiên bản mới từ cấu hình này</span>
          </Button>
        </div>
      </div>

      {/* Version Selector Strip & Status Banner */}
      <div className="bg-white rounded-[12px] border border-[#D4E2EC] p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-bold text-[#526B7C] mr-2">
            Phiên bản tiêu chí:
          </span>
          {criteriaVersions.map((ver) => {
            const isSelected = ver.id === selectedVersionId;
            return (
              <button
                key={ver.id}
                type="button"
                onClick={() => handleSelectVersion(ver.id)}
                className={`px-3 py-1.5 rounded-[8px] text-[12.5px] font-bold transition-colors cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-[#0D78AE] text-white border-[#0D78AE] shadow-xs'
                    : 'bg-[#F8FBFD] text-[#172A3A] border-[#DCE7EE] hover:bg-[#EEF6FA]'
                }`}
              >
                <span>{ver.versionCode}</span>
                {ver.status === 'applied' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[#EAFBF1] text-[#136F3A]'
                    }`}
                  >
                    Đang áp dụng
                  </span>
                )}
                {ver.status === 'draft' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[#FEF6EB] text-[#B45309]'
                    }`}
                  >
                    Bản nháp
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-[12px]">
          {isDraft ? (
            <span className="text-[#B45309] font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              <span>Chế độ chỉnh sửa (Bản nháp)</span>
            </span>
          ) : (
            <span className="text-[#526B7C] flex items-center gap-1">
              <Lock size={13} className="text-[#94A3B8]" />
              <span>Phiên bản đã áp dụng chính thức (Chỉ đọc)</span>
            </span>
          )}
        </div>
      </div>

      {/* Category Track Switcher (Prompt UX-S4 Section 8) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-[10px] border border-[#D4E2EC] shadow-2xs">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-[#0D78AE]" />
          <span className="text-[12px] font-bold text-[#526B7C]">Hạng mục tiêu chí:</span>
          <div className="inline-flex rounded-lg p-0.5 bg-[#F1F5F9] border border-[#E2E8F0] text-[12px] font-bold">
            <button
              type="button"
              onClick={() => setActiveTrack('individual')}
              className={`px-3 py-1 rounded-[6px] transition-all cursor-pointer ${
                activeTrack === 'individual'
                  ? 'bg-white text-[#0D78AE] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F2335]'
              }`}
            >
              Cá nhân (05 Tiêu chuẩn chuẩn hóa)
            </button>
            <button
              type="button"
              onClick={() => setActiveTrack('collective')}
              className={`px-3 py-1 rounded-[6px] transition-all cursor-pointer ${
                activeTrack === 'collective'
                  ? 'bg-white text-[#7C3AED] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F2335]'
              }`}
            >
              Tập thể (04 Tiêu chuẩn TT01–TT04)
            </button>
          </div>
        </div>

        <div className="text-[11.5px] text-[#526B7C]">
          {activeTrack === 'individual'
            ? 'Khung 05 tiêu chuẩn cá nhân: Đạo đức, Học tập, Thể lực, Tình nguyện, Hội nhập'
            : 'Khung 04 tiêu chuẩn tập thể (TT01–TT04): Hoạt động chủ đề, 100% đăng ký, ≥ 20% đạt SV5T cấp Trường, Không kỷ luật'}
        </div>
      </div>

      {activeTrack === 'collective' ? (
        <CriteriaCollectiveAndDryRunPanel
          selectedVersion={selectedVersion}
          isDraftEditable={isDraft}
          collectiveCriteria={workingCollectiveCriteria}
          onChangeCollectiveCriteria={(next) => {
            setWorkingCollectiveCriteria(next);
            setHasUnsavedChanges(true);
          }}
        />
      ) : (
        /* 3-Pane Structured Editor (Prompt 21 Section 55) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Pane 1: 5 Criteria Navigation (Left 3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-[12px] border border-[#D4E2EC] p-3 shadow-2xs space-y-1.5">
          <div className="px-2 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#526B7C]">
            Đúng 05 tiêu chuẩn cấp ĐHĐN
          </div>

          {[
            { id: 'ethics', num: 1, name: 'Đạo đức tốt' },
            { id: 'academic', num: 2, name: 'Học tập tốt' },
            { id: 'physical', num: 3, name: 'Thể lực tốt' },
            { id: 'volunteer', num: 4, name: 'Tình nguyện tốt' },
            { id: 'integration', num: 5, name: 'Hội nhập tốt' },
          ].map((item) => {
            const isActive = activeCriterionKey === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveCriterionKey(item.id);
                  const firstReq = workingCriteria[item.id]?.groups[0]?.requirements[0]?.id;
                  if (firstReq) setSelectedRequirementId(firstReq);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-[8px] text-[13px] font-bold transition-colors cursor-pointer flex items-center justify-between ${
                  isActive
                    ? 'bg-[#EBF6FC] text-[#0D78AE] border border-[#CCE7F6]'
                    : 'text-[#172A3A] hover:bg-[#F8FBFD] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-extrabold ${
                      isActive
                        ? 'bg-[#0D78AE] text-white'
                        : 'bg-[#EEF4F8] text-[#526B7C]'
                    }`}
                  >
                    {item.num}
                  </span>
                  <span>{item.name}</span>
                </div>
                <ChevronRight size={14} className={isActive ? 'text-[#0D78AE]' : 'text-[#A0AEC0]'} />
              </button>
            );
          })}
        </div>

        {/* Pane 2: Groups & Requirements List (Center 5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-[12px] border border-[#D4E2EC] p-4 shadow-2xs">
            <h3 className="text-[15px] font-extrabold text-[#0F2335]">
              {activeCriterion?.vietnameseTitle}
            </h3>
            <p className="text-[12px] text-[#526B7C] mt-0.5">
              {activeCriterion?.shortSummary}
            </p>
          </div>

          {activeCriterion?.groups.map((group, gIdx) => (
            <div
              key={group.id}
              className="bg-white rounded-[12px] border border-[#D4E2EC] overflow-hidden shadow-2xs"
            >
              <div className="px-4 py-2.5 bg-[#F8FBFD] border-b border-[#DCE7EE] flex items-center justify-between">
                <div>
                  <span className="text-[10.5px] font-extrabold uppercase text-[#526B7C]">
                    Nhóm {gIdx + 1}
                  </span>
                  <div className="text-[13px] font-extrabold text-[#0F2335]">
                    {group.title}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EBF6FC] text-[#0D78AE] border border-[#CCE7F6]">
                  {group.ruleBadge}
                </span>
              </div>

              <div className="divide-y divide-[#EEF4F8]">
                {group.requirements.map((req) => {
                  const isSelected = selectedRequirementId === req.id;
                  return (
                    <button
                      key={req.id}
                      type="button"
                      onClick={() => setSelectedRequirementId(req.id)}
                      className={`w-full text-left p-3.5 transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#F2F8FC] border-l-4 border-[#0D78AE]'
                          : 'hover:bg-[#F8FBFD]'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.2 rounded text-[10.5px] font-bold bg-[#EEF4F8] text-[#475569] font-mono">
                            {req.code}
                          </span>
                          <span className="font-bold text-[#172A3A] text-[13px]">
                            {req.title}
                          </span>
                        </div>
                        {req.ruleHelper && (
                          <p className="text-[11.5px] text-[#526B7C] line-clamp-1">
                            {req.ruleHelper}
                          </p>
                        )}
                      </div>

                      <span className="px-1.5 py-0.5 rounded text-[10.5px] font-semibold bg-[#F8FBFD] border border-[#DCE7EE] text-[#526B7C] shrink-0">
                        {req.declarationMultiplicity === 'SINGLE'
                          ? 'Một kê khai'
                          : 'Nhiều kê khai'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Pane 3: Right Inspector: Selected Requirement Config (Right 4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-[12px] border border-[#D4E2EC] p-5 shadow-2xs space-y-4 sticky top-[80px]">
          {selectedRequirementInfo ? (
            <>
              <div className="border-b border-[#EEF4F8] pb-3">
                <span className="text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-[#0D78AE]">
                  Cấu hình yêu cầu
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-1.5 py-0.2 rounded text-[11px] font-bold bg-[#EEF4F8] text-[#475569] font-mono">
                    {selectedRequirementInfo.requirement.code}
                  </span>
                  <h3 className="text-[14px] font-extrabold text-[#0F2335]">
                    {selectedRequirementInfo.requirement.title}
                  </h3>
                </div>
              </div>

              <div className="space-y-3.5 text-[12.5px]">
                <div>
                  <label className="block text-[11.5px] font-bold text-[#526B7C] mb-1">
                    Tên yêu cầu hiển thị
                  </label>
                  <input
                    type="text"
                    disabled={!isDraft}
                    value={selectedRequirementInfo.requirement.title}
                    onChange={(e) =>
                      handleUpdateRequirement(
                        selectedRequirementInfo.requirement.id,
                        { title: e.target.value }
                      )
                    }
                    className="w-full h-[36px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[7px] text-[12.5px] outline-none disabled:bg-[#F1F5F9] disabled:text-[#64748B]"
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-bold text-[#526B7C] mb-1">
                    Mô tả hướng dẫn đạt chuẩn
                  </label>
                  <textarea
                    rows={2}
                    disabled={!isDraft}
                    value={selectedRequirementInfo.requirement.ruleHelper || ''}
                    onChange={(e) =>
                      handleUpdateRequirement(
                        selectedRequirementInfo.requirement.id,
                        { ruleHelper: e.target.value }
                      )
                    }
                    className="w-full p-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[7px] text-[12px] outline-none disabled:bg-[#F1F5F9] disabled:text-[#64748B]"
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-bold text-[#526B7C] mb-1">
                    Chế độ kê khai (Multiplicity)
                  </label>
                  <select
                    disabled={!isDraft}
                    value={
                      selectedRequirementInfo.requirement.declarationMultiplicity ||
                      'MULTIPLE'
                    }
                    onChange={(e) =>
                      handleUpdateRequirement(
                        selectedRequirementInfo.requirement.id,
                        {
                          declarationMultiplicity: e.target
                            .value as DeclarationMultiplicity,
                        }
                      )
                    }
                    className="w-full h-[36px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[7px] text-[12.5px] outline-none cursor-pointer disabled:bg-[#F1F5F9]"
                  >
                    <option value="SINGLE">
                      Một kê khai (Chỉ 1 kết quả duy nhất / năm)
                    </option>
                    <option value="MULTIPLE">
                      Có thể kê khai nhiều nội dung (Mặc định cho thành tích / hoạt động)
                    </option>
                  </select>
                  <span className="text-[11px] text-[#526B7C] mt-1 block">
                    Điểm học tập hoặc điểm rèn luyện chọn "Một kê khai". Hoạt
                    động, giải thưởng, bài báo chọn "Nhiều nội dung".
                  </span>
                </div>

                <div>
                  <label className="block text-[11.5px] font-bold text-[#526B7C] mb-1">
                    Trích dẫn quy định văn bản
                  </label>
                  <div className="p-2.5 rounded-[8px] bg-[#F8FBFD] border border-[#E2EDF5] text-[11.5px] text-[#526B7C]">
                    {selectedRequirementInfo.requirement.regulationSnippet ||
                      'Áp dụng theo quy chế xét chọn danh hiệu Sinh viên 5 tốt cấp Đại học Đà Nẵng.'}
                  </div>
                </div>

                <div className="p-3 rounded-[8px] bg-[#EBF6FC] border border-[#CCE7F6] text-[11.5px] text-[#0A527A] flex items-start gap-2">
                  <Info size={14} className="text-[#0D78AE] shrink-0 mt-0.5" />
                  <span>
                    Minh chứng sinh viên nộp là minh chứng thực tế (chứng chỉ, giấy
                    khen, quyết định) phục vụ cán bộ thẩm định.
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-[#526B7C] text-[13px]">
              Vui lòng chọn một yêu cầu bên trái để xem cấu hình.
            </div>
          )}
        </div>
      </div>
      )}

      {/* Validation Result Box */}
      {validationResult && (
        <div
          className={`p-4 rounded-[10px] border text-[13px] ${
            validationResult.isValid
              ? 'bg-[#EAFBF1] border-[#B6E6C9] text-[#136F3A]'
              : 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]'
          }`}
        >
          <div className="font-extrabold flex items-center gap-2">
            {validationResult.isValid ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span>
              {validationResult.isValid
                ? `Cấu hình hợp lệ! Tổng cộng: 5 tiêu chí · ${validationResult.totalGroups} nhóm yêu cầu · ${validationResult.totalRequirements} nội dung.`
                : `Phát hiện ${validationResult.errors.length} vấn đề cấu hình:`}
            </span>
          </div>
          {!validationResult.isValid && (
            <ul className="mt-2 list-disc list-inside space-y-1 text-[12px]">
              {validationResult.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Sticky Bottom Action Bar (Prompt 21 Section 135) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DCE7EE] px-6 py-3 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3 text-[12.5px]">
          <span className="font-bold text-[#172A3A]">
            Đang quản lý: {selectedVersion.versionCode}
          </span>
          {hasUnsavedChanges && (
            <span className="text-[#D97706] font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#D97706]" />
              <span>Có thay đổi chưa lưu</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" onClick={handleValidate}>
            Kiểm tra tính hợp lệ
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsPreviewOpen(true)}
          >
            Xem trước giao diện
          </Button>

          {isDraft && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveDraft}
              className="flex items-center gap-1.5"
            >
              <Save size={14} />
              <span>Lưu bản nháp</span>
            </Button>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <CriteriaPreviewModal
          versionCode={selectedVersion.versionCode}
          versionTitle={selectedVersion.title}
          criteria={workingCriteria}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}

      {/* Duplicate Version Modal (Prompt 21 Section 63 & Demo Flow D) */}
      {isDuplicateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[14px] border border-[#D4E2EC] max-w-[500px] w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEF4F8] pb-3">
              <h2 className="text-[16px] font-extrabold text-[#0F2335]">
                Tạo phiên bản tiêu chí mới từ hiện tại
              </h2>
              <button
                type="button"
                onClick={() => setIsDuplicateOpen(false)}
                className="p-1 text-[#607483] hover:text-[#0F2335]"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-[12.5px] text-[#526B7C]">
              Hệ thống sẽ sao chép toàn bộ cấu hình 05 tiêu chí, nhóm yêu cầu và
              hướng dẫn minh chứng từ{' '}
              <strong className="text-[#0F2335]">
                {selectedVersion.versionCode}
              </strong>{' '}
              sang một bản dự thảo mới để biên tập an toàn.
            </p>

            <div className="space-y-3 text-[13px]">
              <div>
                <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                  Mã phiên bản mới (ví dụ: 2027–2028 Draft)
                </label>
                <input
                  type="text"
                  value={duplicateForm.versionCode}
                  onChange={(e) =>
                    setDuplicateForm({
                      ...duplicateForm,
                      versionCode: e.target.value,
                    })
                  }
                  className="w-full h-[40px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                  Tên hiển thị khung tiêu chí
                </label>
                <input
                  type="text"
                  value={duplicateForm.title}
                  onChange={(e) =>
                    setDuplicateForm({
                      ...duplicateForm,
                      title: e.target.value,
                    })
                  }
                  className="w-full h-[40px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EEF4F8]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsDuplicateOpen(false)}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onCreateCriteriaVersionFromCurrent(
                    selectedVersion.id,
                    duplicateForm.versionCode.trim(),
                    duplicateForm.title.trim()
                  );
                  setIsDuplicateOpen(false);
                }}
              >
                Khởi tạo bản nháp
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
