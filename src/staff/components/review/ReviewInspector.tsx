/**
 * 5TOT ĐHĐN — Right-Side Officer Review Inspector (ReviewInspector)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 17 Sections 31–38, 46, 49–57, 70–76, 80–84, 113:
 * - Clearly displays selected scope context (Criterion -> Requirement -> Declaration).
 * - Strict separation between "Ghi chú nội bộ" (staff-only, autosaved with retry)
 *   and Student-facing "Nội dung yêu cầu bổ sung".
 * - Supports "Cần xem xét thêm" with required internal reason (distinct from supplement and not rejection).
 * - Includes Reviewer Regulation View sourced from CRITERIA_DEFINITIONS & REGULATION_DATA.
 * - Sticky bottom action area (not duplicated at top and bottom).
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Eye,
  MessageSquareWarning,
  Flag,
  BookOpen,
  History,
  Check,
  AlertCircle,
  Lock,
  PlayCircle,
  Sparkles,
  X,
  XCircle,
  ChevronRight,
  Info,
} from 'lucide-react';
import { CRITERIA } from '../../../tokens';
import {
  RequirementDefinition,
} from '../../../demo/fixtures/criteriaDefinitions';
import { REGULATION_DATA } from '../../../demo/fixtures/regulationData';
import {
  ApplicationDeclaration,
  ApplicationEvidence,
} from '../../../demo/fixtures/studentApplication';
import {
  ApplicationReviewWorkspaceState,
  EVIDENCE_REVIEW_STATUS_META,
  ITEM_REVIEW_STATUS_META,
  ReviewHistoryEvent,
  SelectedReviewScope,
  StaffItemReviewStatus,
} from '../../reviewTypes';
import {
  canRequestSupplement,
  getActiveSupplementForScope,
  getLatestSupplementForScope,
  getScopeReviewRecord,
} from '../../reviewSelectors';
import { StaffApplicationRecord, StaffUser } from '../../types';
import { ReviewStage } from '../../schoolReviewTypes';
import { FileTypeIcon } from '../../../components/evidence/FileTypeIcon';

import { InspectorRegulationSection } from './inspector/InspectorRegulationSection';
import { InspectorJudgmentSection } from './inspector/InspectorJudgmentSection';
import { ReviewCopilotPanel } from './copilot/ReviewCopilotPanel';

export interface ReviewInspectorProps {
  currentUser: StaffUser;
  applicationRecord: StaffApplicationRecord;
  workspaceState: ApplicationReviewWorkspaceState;
  selectedScope: SelectedReviewScope;
  selectedRequirementDef?: RequirementDefinition;
  selectedDeclaration?: ApplicationDeclaration;
  currentScopeStatus: StaffItemReviewStatus;
  canMutate: boolean;
  inspectorMode: 'review' | 'regulation' | 'copilot';
  onChangeInspectorMode: (mode: 'review' | 'regulation' | 'copilot') => void;
  onUpdateStatus: (
    scope: SelectedReviewScope,
    nextStatus: StaffItemReviewStatus,
    unsuitableReason?: string,
    considerationReason?: string
  ) => void;
  onSaveInternalNote: (
    scope: SelectedReviewScope,
    noteText: string
  ) => boolean;
  onSaveConsiderationReason: (
    scope: SelectedReviewScope,
    reasonText: string
  ) => void;
  onOpenSupplementModal: (scope: SelectedReviewScope, draftText?: string) => void;
  onContinueAfterSupplement: (scope: SelectedReviewScope) => void;
  onOpenFullHistory: () => void;
  onOpenEvidenceViewer?: (
    evidence: ApplicationEvidence,
    evidenceList: ApplicationEvidence[],
    scope: SelectedReviewScope,
    requirementTitle: string,
    declarationTitle?: string
  ) => void;
  simulateNoteSaveError?: boolean;
  onUnsavedNoteChange?: (hasUnsaved: boolean) => void;
  onCloseMobileOverlay?: () => void;
  hasStartedReview?: boolean;
  onStartReview?: () => void;
  disabledReason?: string;
  reviewStage?: ReviewStage;
}

export const ReviewInspector: React.FC<ReviewInspectorProps> = ({
  currentUser,
  applicationRecord,
  workspaceState,
  selectedScope,
  selectedRequirementDef,
  selectedDeclaration,
  currentScopeStatus,
  canMutate,
  inspectorMode,
  onChangeInspectorMode,
  onUpdateStatus,
  onSaveInternalNote,
  onSaveConsiderationReason,
  onOpenSupplementModal,
  onContinueAfterSupplement,
  onOpenFullHistory,
  onOpenEvidenceViewer,
  simulateNoteSaveError = false,
  onUnsavedNoteChange,
  onCloseMobileOverlay,
  hasStartedReview = true,
  onStartReview,
  disabledReason,
  reviewStage = 'CITY',
}) => {
  const isSchoolStage = reviewStage === 'SCHOOL';
  const criterionToken = CRITERIA[selectedScope.criterionId];
  const criterionRegulation = REGULATION_DATA[selectedScope.criterionId];
  const scopeRecord = getScopeReviewRecord(
    workspaceState,
    selectedScope.requirementId,
    selectedScope.declarationId
  );
  const statusMeta = ITEM_REVIEW_STATUS_META[currentScopeStatus];

  // Local note state + reliable autosave (Sections 70–73, 113)
  const [noteText, setNoteText] = useState<string>(
    scopeRecord?.internalNote || ''
  );
  const [saveState, setSaveState] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('saved');

  // Local state for "Cần xem xét thêm" form (Sections 54–57)
  const [isConsiderationFormOpen, setIsConsiderationFormOpen] =
    useState<boolean>(false);
  const [considerationInput, setConsiderationInput] = useState<string>(
    scopeRecord?.considerationReason || ''
  );
  const [considerationError, setConsiderationError] = useState<string | null>(
    null
  );

  // Local state for "Không phù hợp" form (Prompt 22.3 Section 4)
  const [isUnsuitableFormOpen, setIsUnsuitableFormOpen] =
    useState<boolean>(false);
  const [unsuitableInput, setUnsuitableInput] = useState<string>(
    scopeRecord?.unsuitableReason || ''
  );
  const [unsuitableError, setUnsuitableError] = useState<string | null>(null);

  const autosaveTimerRef = useRef<number | null>(null);

  // Sync local fields when selectedScope changes
  useEffect(() => {
    const rec = getScopeReviewRecord(
      workspaceState,
      selectedScope.requirementId,
      selectedScope.declarationId
    );
    setNoteText(rec?.internalNote || '');
    setConsiderationInput(rec?.considerationReason || '');
    setUnsuitableInput(rec?.unsuitableReason || '');
    setIsConsiderationFormOpen(false);
    setIsUnsuitableFormOpen(false);
    setConsiderationError(null);
    setUnsuitableError(null);
    setSaveState('saved');
    onUnsavedNoteChange?.(false);
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }
  }, [
    selectedScope.criterionId,
    selectedScope.requirementId,
    selectedScope.declarationId,
    workspaceState.applicationId,
  ]);

  const triggerNoteSave = (textToSave: string) => {
    setSaveState('saving');
    window.setTimeout(() => {
      if (simulateNoteSaveError) {
        setSaveState('error');
        onUnsavedNoteChange?.(true);
        return;
      }
      const ok = onSaveInternalNote(selectedScope, textToSave);
      if (ok) {
        setSaveState('saved');
        onUnsavedNoteChange?.(false);
      } else {
        setSaveState('error');
        onUnsavedNoteChange?.(true);
      }
    }, 280);
  };

  const handleNoteChange = (nextVal: string) => {
    setNoteText(nextVal);
    setSaveState('saving');
    onUnsavedNoteChange?.(true);
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = window.setTimeout(() => {
      triggerNoteSave(nextVal);
    }, 550);
  };

  const handleConsiderationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = considerationInput.trim();
    if (!trimmed) {
      setConsiderationError('Vui lòng nhập lý do cần xem xét thêm.');
      return;
    }
    setConsiderationError(null);
    onSaveConsiderationReason(selectedScope, trimmed);
    onUpdateStatus(selectedScope, 'needs_consideration', undefined, trimmed);
    setIsConsiderationFormOpen(false);
  };

  const handleUnsuitableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = unsuitableInput.trim();
    if (!trimmed) {
      setUnsuitableError(
        'Vui lòng nhập lý do không phù hợp để lưu vào hồ sơ nội bộ.'
      );
      return;
    }
    setUnsuitableError(null);
    onUpdateStatus(selectedScope, 'unsuitable', trimmed);
    setIsUnsuitableFormOpen(false);
  };

  const activeSupplement = getActiveSupplementForScope(
    workspaceState,
    selectedScope
  );
  const latestSupplement = getLatestSupplementForScope(
    workspaceState,
    selectedScope
  );
  const supplementEligibility = canRequestSupplement(
    currentUser,
    applicationRecord,
    workspaceState,
    selectedScope
  );

  const recentEvents: ReviewHistoryEvent[] = workspaceState.historyEvents.slice(
    0,
    3
  );

  return (
    <aside
      aria-label="Khung thông tin và thao tác xét duyệt"
      className="w-full bg-white flex flex-col justify-between h-full select-none border-0 min-w-0 overflow-hidden"
    >
      {/* Top Mode Tabs + Context Header */}
      <div className="shrink-0">
        {/* Mode Switcher: Xét duyệt nội dung vs Quy định áp dụng (Sections 35 & 74) */}
        <div className="px-4 pt-3.5 pb-2.5 bg-[#F8FBFD] border-b border-[#F0F4F8] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-[#EEF3F7] p-1 rounded-[10px] flex-1 min-w-0">
            <button
              type="button"
              onClick={() => onChangeInspectorMode('review')}
              className={`flex-1 py-1.5 px-1.5 rounded-[8px] text-[11.5px] font-bold transition-all cursor-pointer border-0 truncate ${
                inspectorMode === 'review'
                  ? 'bg-white text-[#172A3A] shadow-2xs'
                  : 'text-[#607483] hover:text-[#172A3A]'
              }`}
            >
              Xét duyệt
            </button>
            <button
              type="button"
              onClick={() => onChangeInspectorMode('regulation')}
              className={`flex-1 py-1.5 px-1.5 rounded-[8px] text-[11.5px] font-bold inline-flex items-center justify-center gap-1 transition-all cursor-pointer border-0 truncate ${
                inspectorMode === 'regulation'
                  ? 'bg-white text-[#172A3A] shadow-2xs'
                  : 'text-[#607483] hover:text-[#172A3A]'
              }`}
            >
              <BookOpen size={12} className="shrink-0" />
              <span className="truncate">Quy định</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeInspectorMode('copilot')}
              className={`flex-1 py-1.5 px-1.5 rounded-[8px] text-[11.5px] font-bold inline-flex items-center justify-center gap-1 transition-all cursor-pointer border-0 truncate ${
                inspectorMode === 'copilot'
                  ? 'bg-white text-[#1680DE] shadow-2xs'
                  : 'text-[#607483] hover:text-[#1680DE]'
              }`}
            >
              <Sparkles size={12} className="shrink-0 text-[#1680DE]" />
              <span className="truncate">Trợ lý AI</span>
            </button>
          </div>

          {onCloseMobileOverlay && (
            <button
              type="button"
              onClick={onCloseMobileOverlay}
              aria-label="Đóng khung xét duyệt"
              className="p-1.5 rounded-[8px] text-[#607483] hover:text-[#172A3A] hover:bg-[#EEF3F7] cursor-pointer transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Selected Scope Context Header (Prompt 22.3 Section 3) */}
        <div className="p-4 bg-white space-y-2 border-b border-[#F0F4F8]">
          <div className="flex items-center justify-between gap-2">
            <span className="px-2 py-0.5 rounded-[6px] bg-[#EAF5FC] text-[#0D78AE] text-[11px] font-bold uppercase tracking-wider">
              {isSchoolStage
                ? selectedDeclaration
                  ? 'Xét sơ kê khai'
                  : 'Xét sơ yêu cầu'
                : selectedDeclaration
                ? 'Xét duyệt kê khai'
                : 'Xét duyệt yêu cầu'}
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[11px] font-bold border"
              style={{
                backgroundColor: statusMeta.bgColor,
                color: statusMeta.textColor,
                borderColor: statusMeta.borderColor,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: statusMeta.dotColor }}
              />
              <span>{statusMeta.label}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1680DE] flex-wrap">
            <span>
              0{criterionToken.number} · {criterionToken.name}
            </span>
            {selectedRequirementDef && (
              <>
                <span className="text-[#B8CAD8]">→</span>
                <span className="text-[#526B7C] truncate max-w-[200px]">
                  {selectedRequirementDef.title}
                </span>
              </>
            )}
          </div>

          <h3 className="text-[14px] font-bold text-[#172A3A] leading-snug break-words">
            {selectedDeclaration
              ? selectedDeclaration.value
              : selectedRequirementDef?.title || criterionToken.name}
          </h3>

          {selectedDeclaration?.detail && (
            <p className="text-[12px] text-[#607483] break-words">
              {selectedDeclaration.detail}
            </p>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODE SELECTION: COPILOT vs REGULATION vs MANUAL REVIEW              */}
      {/* =================================================================== */}
      {inspectorMode === 'copilot' ? (
        <ReviewCopilotPanel
          currentUser={currentUser}
          applicationRecord={applicationRecord}
          selectedScope={selectedScope}
          selectedRequirementDef={selectedRequirementDef}
          selectedDeclaration={selectedDeclaration}
          currentScopeStatus={currentScopeStatus}
          canMutate={canMutate}
          reviewStage={reviewStage}
          evidenceList={
            selectedDeclaration
              ? (selectedDeclaration.evidence || selectedDeclaration.evidenceFiles || [])
              : []
          }
          onApplyStatus={(status, unsuitReason, consReason) => {
            onUpdateStatus(selectedScope, status, unsuitReason, consReason);
          }}
          onInsertInternalNote={(note) => {
            handleNoteChange(note);
            triggerNoteSave(note);
            onSaveInternalNote(selectedScope, note);
          }}
          onOpenSupplementWithDraft={(draft) => {
            onOpenSupplementModal(selectedScope, draft);
          }}
        />
      ) : inspectorMode === 'regulation' ? (
        <InspectorRegulationSection
          criterionRegulation={criterionRegulation}
          selectedRequirementDef={selectedRequirementDef}
        />
      ) : (
        /* ================================================================= */
        /* MODE B: DECLARATION REVIEW INSPECTOR CONTENT (Prompt 22.3)        */
        /* ================================================================= */
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 space-y-4 min-w-0">
          {/* SECTION A: THÔNG TIN KÊ KHAI (Prompt 22.3 Section 3) */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-bold text-[#0F2335] uppercase tracking-wider">
                A. Thông tin kê khai
              </span>
              <span className="text-[11px] text-[#607483]">
                {selectedDeclaration ? 'Sinh viên tự khai' : 'Mục xét duyệt'}
              </span>
            </div>

            <div className="p-3 rounded-[12px] bg-[#F8FBFD] border border-[#E3EEF5] space-y-2 text-[12px]">
              <div>
                <div className="text-[11px] text-[#607483] font-medium">
                  Nội dung / Danh hiệu / Thành tích
                </div>
                <div className="font-bold text-[#172A3A] text-[13px] mt-0.5 leading-snug">
                  {selectedDeclaration?.value || selectedRequirementDef?.title}
                </div>
              </div>

              {selectedDeclaration?.detail && (
                <div>
                  <div className="text-[11px] text-[#607483] font-medium">
                    Cơ quan ban hành / Chi tiết
                  </div>
                  <div className="text-[#334E68] mt-0.5">
                    {selectedDeclaration.detail}
                  </div>
                </div>
              )}

              {selectedDeclaration?.date && (
                <div className="flex items-center gap-1.5 text-[11.5px] text-[#4A6275]">
                  <span className="text-[#607483]">Ngày ghi nhận / Cấp:</span>
                  <span className="font-semibold text-[#172A3A] tabular-nums">
                    {selectedDeclaration.date}
                  </span>
                </div>
              )}

              {scopeRecord?.unsuitableReason &&
                currentScopeStatus === 'unsuitable' && (
                  <div className="p-2.5 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-[11.5px] text-[#DC2626] space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <XCircle size={12.5} />
                      <span>Lý do không phù hợp (Nội bộ):</span>
                    </div>
                    <div>“{scopeRecord.unsuitableReason}”</div>
                  </div>
                )}

              {scopeRecord?.considerationReason &&
                currentScopeStatus === 'needs_consideration' && (
                  <div className="p-2.5 rounded-[8px] bg-[#F5F3FF] border border-[#DDD6FE] text-[11.5px] text-[#5B21B6] space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <Flag size={12.5} />
                      <span>Lý do cần xem xét thêm (Nội bộ):</span>
                    </div>
                    <div>“{scopeRecord.considerationReason}”</div>
                  </div>
                )}
            </div>
          </section>

          {/* SECTION B: CÁC MINH CHỨNG LIÊN QUAN (Prompt 22.3 Section 3) */}
          <section className="space-y-2 pt-2 border-t border-[#EEF4F8]">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-bold text-[#0F2335] uppercase tracking-wider">
                B. Các minh chứng liên quan
              </span>
              <span className="text-[11px] font-bold text-[#1680DE] tabular-nums">
                {selectedDeclaration
                  ? (selectedDeclaration.evidence || selectedDeclaration.evidenceFiles || []).length
                  : 0}{' '}
                minh chứng
              </span>
            </div>

            {(() => {
              const declEvidenceList = selectedDeclaration
                ? selectedDeclaration.evidence || selectedDeclaration.evidenceFiles || []
                : [];
              if (declEvidenceList.length === 0) {
                return (
                  <p className="text-[11.5px] text-[#8295A5] italic bg-[#F8FBFD] p-3 rounded-[10px] border border-[#E3EEF5]">
                    Chưa có tệp minh chứng đính kèm cho nội dung kê khai này.
                  </p>
                );
              }
              return (
                <div className="space-y-1.5">
                  {declEvidenceList.map((ev) => {
                    const evRec = workspaceState.evidenceRecords?.[ev.id];
                    const evStatus = evRec?.status || 'not_reviewed';
                    const evMeta =
                      EVIDENCE_REVIEW_STATUS_META[evStatus] ||
                      EVIDENCE_REVIEW_STATUS_META.not_reviewed;
                    return (
                      <div
                        key={ev.id}
                        className="p-2.5 rounded-[10px] bg-[#F8FBFD] border border-[#E3EEF5] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileTypeIcon
                            fileName={ev.name}
                            fileType={ev.fileType}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                title={ev.name}
                                className="text-[12px] font-semibold text-[#172A3A] truncate max-w-[160px]"
                              >
                                {ev.name}
                              </span>
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold shrink-0"
                                style={{
                                  backgroundColor: evMeta.bgColor,
                                  color: evMeta.textColor,
                                  border: `1px solid ${evMeta.borderColor}`,
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: evMeta.dotColor }}
                                />
                                {evMeta.shortLabel}
                              </span>
                            </div>
                            <div className="text-[10.5px] text-[#607483] uppercase tabular-nums">
                              {ev.fileType} · {ev.uploadedAt || '11/10/2026'}
                            </div>
                          </div>
                        </div>

                        {onOpenEvidenceViewer && (
                          <button
                            type="button"
                            onClick={() =>
                              onOpenEvidenceViewer(
                                ev,
                                declEvidenceList,
                                selectedScope,
                                selectedRequirementDef?.title || '',
                                selectedDeclaration?.value
                              )
                            }
                            className="text-[11.5px] font-bold text-[#1680DE] hover:underline shrink-0 cursor-pointer"
                          >
                            Xem & xét
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>

          {/* SECTION C: QUY ĐỊNH ÁP DỤNG (Prompt 22.3 Section 3) */}
          <section className="space-y-1.5 pt-2 border-t border-[#EEF4F8]">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-bold text-[#0F2335] uppercase tracking-wider">
                C. Quy định áp dụng
              </span>
              <button
                type="button"
                onClick={() => onChangeInspectorMode('regulation')}
                className="text-[11px] font-bold text-[#1680DE] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Xem văn bản</span>
                <ChevronRight size={12} />
              </button>
            </div>

            <div className="p-2.5 rounded-[10px] bg-[#F8FBFD] border border-[#E3EEF5] space-y-1.5 text-[11.5px] text-[#334E68]">
              {selectedRequirementDef && (
                <div>
                  <strong className="text-[#0F2335]">Tiêu chuẩn: </strong>
                  <span>
                    {selectedRequirementDef.ruleHelper ||
                      selectedRequirementDef.regulationSnippet}
                  </span>
                </div>
              )}
              {criterionRegulation && (
                <div className="text-[11px] text-[#607483]">
                  {criterionRegulation.source.documentName} (
                  {criterionRegulation.source.documentNumber})
                </div>
              )}
            </div>
          </section>

          {/* SECTION D: NHẬN XÉT CỦA CÁN BỘ (Prompt 22.3 Section 3) */}
          <section className="space-y-1.5 pt-2 border-t border-[#EEF4F8]">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="officer-internal-note"
                className="text-[11.5px] font-bold text-[#0F2335] uppercase tracking-wider flex items-center gap-1.5"
              >
                <Lock size={12} className="text-[#526B7C]" />
                <span>{isSchoolStage ? 'D. Nhận xét xét sơ tuyển' : 'D. Nhận xét của cán bộ'}</span>
              </label>

              <div className="text-[11px] font-medium">
                {saveState === 'saving' && (
                  <span className="text-[#0D78AE]">Đang lưu...</span>
                )}
                {saveState === 'saved' && (
                  <span className="text-[#607483]">Đã lưu</span>
                )}
                {saveState === 'error' && (
                  <span className="text-[#DC2626] font-bold inline-flex items-center gap-1">
                    <AlertCircle size={11.5} />
                    <span>Lỗi lưu.</span>
                    <button
                      type="button"
                      onClick={() => triggerNoteSave(noteText)}
                      className="underline ml-0.5 cursor-pointer"
                    >
                      Thử lại
                    </button>
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-[#607483]">
              {isSchoolStage
                ? 'Chỉ lưu hành nội bộ Đơn vị xét sơ cấp Trường. Không hiển thị cho sinh viên.'
                : 'Chỉ lưu hành nội bộ cán bộ xét duyệt, Quản lý và Hội đồng. Không hiển thị cho sinh viên.'}
            </p>

            <textarea
              id="officer-internal-note"
              rows={3}
              disabled={!canMutate}
              value={noteText}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder={
                isSchoolStage
                  ? 'Ghi chú nhận xét xét sơ tuyển đối chiếu kê khai và minh chứng...'
                  : 'Ghi chú nhận xét chuyên môn đối chiếu kê khai và minh chứng...'
              }
              className="w-full p-2.5 text-[12px] text-[#172A3A] placeholder:text-[#8295A5] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white transition-colors resize-y"
            />

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10.5px] text-[#607483]">
                {saveState === 'saved' && noteText ? 'Đã lưu vào hồ sơ' : ''}
              </span>
              {canMutate && (
                <button
                  type="button"
                  disabled={saveState === 'saving'}
                  onClick={() => triggerNoteSave(noteText)}
                  className="px-2.5 py-1 rounded-[6px] bg-[#1680DE] hover:bg-[#1371C4] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer border-0 disabled:opacity-50"
                >
                  <Check size={12} />
                  <span>Lưu nhận xét</span>
                </button>
              )}
            </div>
          </section>

          {/* ACTIVE SUPPLEMENT STATUS CARD (IF ANY) */}
          {activeSupplement && (
            <div className="p-2.5 rounded-[8px] bg-[#FEF6EB] border border-[#FADDB6] space-y-1.5 text-[12px]">
              <div className="font-bold text-[#B45309]">
                Đang có yêu cầu bổ sung cho nội dung này.
              </div>
              <p className="text-[#78350F] bg-white/80 p-2 rounded-[6px] border border-[#FDE68A] text-[11.5px]">
                “{activeSupplement.message}”
              </p>
              {activeSupplement.deadline && (
                <div className="text-[11px] text-[#92400E]">
                  Hạn hoàn thành: {activeSupplement.deadline}
                </div>
              )}
            </div>
          )}

          {/* STUDENT RETURNED SUPPLEMENT CARD (IF ANY) */}
          {latestSupplement &&
            latestSupplement.staffStatus === 'student_returned' && (
              <div className="p-2.5 rounded-[8px] bg-[#EAF6FC] border border-[#93C5FD] space-y-2 text-[12px]">
                <div className="font-bold text-[#0B64A0] flex items-center gap-1.5">
                  <Sparkles size={13} />
                  <span>
                    Sinh viên đã gửi bổ sung ({latestSupplement.returnedAt})
                  </span>
                </div>
                <p className="text-[11.5px] text-[#334E68]">
                  Yêu cầu trước đó: “{latestSupplement.message}”
                </p>
                {canMutate && (
                  <button
                    type="button"
                    onClick={() => onContinueAfterSupplement(selectedScope)}
                    className="w-full py-1.5 px-3 rounded-[7px] bg-[#0D78AE] hover:bg-[#0B64A0] text-white font-bold text-[12px] inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <PlayCircle size={13.5} />
                    <span>Tiếp tục xét nội dung này</span>
                  </button>
                )}
              </div>
            )}

          {/* RECENT PROCESSING HISTORY */}
          <section className="space-y-1.5 pt-2 border-t border-[#EEF4F8]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#607483] uppercase tracking-wider flex items-center gap-1">
                <History size={12} />
                <span>Lịch sử xử lý</span>
              </span>
              <button
                type="button"
                onClick={onOpenFullHistory}
                className="text-[11px] font-bold text-[#0D78AE] hover:underline cursor-pointer"
              >
                Xem toàn bộ
              </button>
            </div>
            <div className="space-y-1">
              {recentEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="text-[11px] p-2 rounded-[7px] bg-[#F8FBFD] border border-[#E6EFF5]"
                >
                  <div className="text-[10px] text-[#607483] tabular-nums">
                    {ev.timestamp} · {ev.actorName}
                  </div>
                  <div className="text-[#172A3A] font-medium mt-0.5">
                    {ev.description}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* =================================================================== */}
      {/* SECTION E: KẾT LUẬN XÉT KÊ KHAI (Prompt 22.3 Sections 3, 4, 5, 9)    */}
      <InspectorJudgmentSection
        canMutate={canMutate}
        statusMeta={statusMeta}
        isUnsuitableFormOpen={isUnsuitableFormOpen}
        setIsUnsuitableFormOpen={setIsUnsuitableFormOpen}
        unsuitableInput={unsuitableInput}
        setUnsuitableInput={setUnsuitableInput}
        unsuitableError={unsuitableError}
        setUnsuitableError={setUnsuitableError}
        handleUnsuitableSubmit={handleUnsuitableSubmit}
        isConsiderationFormOpen={isConsiderationFormOpen}
        setIsConsiderationFormOpen={setIsConsiderationFormOpen}
        considerationInput={considerationInput}
        setConsiderationInput={setConsiderationInput}
        considerationError={considerationError}
        setConsiderationError={setConsiderationError}
        handleConsiderationSubmit={handleConsiderationSubmit}
        onUpdateStatus={onUpdateStatus}
        selectedScope={selectedScope}
        currentScopeStatus={currentScopeStatus}
        supplementEligibility={supplementEligibility}
        activeSupplement={activeSupplement}
        onOpenSupplementModal={onOpenSupplementModal}
        hasStartedReview={hasStartedReview}
        onStartReview={onStartReview}
        disabledReason={disabledReason}
      />
    </aside>
  );

};
