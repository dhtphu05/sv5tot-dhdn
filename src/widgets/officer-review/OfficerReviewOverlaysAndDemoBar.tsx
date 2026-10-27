/**
 * 5TOT ĐHĐN — Officer Review Overlays & Floating Demo Bar Widget (FSD Widgets Layer)
 * Encapsulates floating demo scenario switcher, QA toggles, unsaved note dialog, and school history modal.
 */

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  Info,
  Building2,
  X,
} from 'lucide-react';
import { CRITERIA_LIST } from '../../tokens';
import { StaffApplicationRecord } from '../../staff/types';
import { OfficerDemoScenarioId } from '../../staff/reviewTypes';
import { OFFICER_DEMO_SCENARIOS } from '../../staff/fixtures/officerReviewFixtures';
import { Button } from '../../components/buttons/Button';

export interface OfficerReviewOverlaysAndDemoBarProps {
  applicationRecord: StaffApplicationRecord;
  activeOfficerScenarioId: OfficerDemoScenarioId;
  onSelectOfficerScenario: (scenarioId: OfficerDemoScenarioId) => void;
  isCompactInspectorOpen: boolean;
  isScenarioPopoverOpen: boolean;
  onToggleScenarioPopover: () => void;
  onCloseScenarioPopover: () => void;
  showQaControls: boolean;
  onToggleQaControls: () => void;
  isCitySupplementWindowClosed: boolean;
  onSetCitySupplementWindowClosed: (closed: boolean) => void;
  isSimulatedStaleState: boolean;
  onSetSimulatedStaleState: (stale: boolean) => void;
  isSimulatedReassigned: boolean;
  onSetSimulatedReassigned: (reassigned: boolean) => void;
  simulateSupplementError: boolean;
  onSetSimulateSupplementError: (err: boolean) => void;
  simulateNoteError: boolean;
  onSetSimulateNoteError: (err: boolean) => void;
  simulateCompleteError: boolean;
  onSetSimulateCompleteError: (err: boolean) => void;
  isSimulatedCriterionLoading: boolean;
  onSetSimulatedCriterionLoading: (loading: boolean) => void;
  pendingNavAction: (() => void) | null;
  onDiscardUnsavedNoteAndNavigate: () => void;
  onStayToSaveNote: () => void;
  isSchoolHistoryOpen: boolean;
  onCloseSchoolHistory: () => void;
}

export const OfficerReviewOverlaysAndDemoBar: React.FC<
  OfficerReviewOverlaysAndDemoBarProps
> = ({
  applicationRecord,
  activeOfficerScenarioId,
  onSelectOfficerScenario,
  isCompactInspectorOpen,
  isScenarioPopoverOpen,
  onToggleScenarioPopover,
  onCloseScenarioPopover,
  showQaControls,
  onToggleQaControls,
  isCitySupplementWindowClosed,
  onSetCitySupplementWindowClosed,
  isSimulatedStaleState,
  onSetSimulatedStaleState,
  isSimulatedReassigned,
  onSetSimulatedReassigned,
  simulateSupplementError,
  onSetSimulateSupplementError,
  simulateNoteError,
  onSetSimulateNoteError,
  simulateCompleteError,
  onSetSimulateCompleteError,
  isSimulatedCriterionLoading,
  onSetSimulatedCriterionLoading,
  pendingNavAction,
  onDiscardUnsavedNoteAndNavigate,
  onStayToSaveNote,
  isSchoolHistoryOpen,
  onCloseSchoolHistory,
}) => {
  return (
    <>
      {/* Unsaved Note Warning Dialog */}
      {pendingNavAction && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#0F2335]/55 flex items-center justify-center p-4"
        >
          <div className="max-w-[420px] w-full bg-white rounded-[14px] border border-[#D4E3EE] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-[#B45309] font-extrabold text-[15px]">
              <AlertTriangle size={18} />
              <span>Ghi chú nội bộ chưa được lưu</span>
            </div>
            <p className="text-[13px] text-[#334E68] leading-relaxed">
              Nhận xét chuyên môn bạn vừa nhập chưa được lưu thành công. Bạn có muốn ở lại để lưu ghi chú trước khi chuyển mục không?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={onDiscardUnsavedNoteAndNavigate}
              >
                Bỏ qua thay đổi
              </Button>
              <Button variant="primary" size="sm" onClick={onStayToSaveNote}>
                Ở lại lưu ghi chú
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* School History Inspector Dialog */}
      {isSchoolHistoryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Lịch sử xét sơ tuyển cấp Trường"
          className="fixed inset-0 z-50 bg-[#0F2335]/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-[620px] bg-white rounded-[20px] shadow-[0_20px_60px_rgba(15,35,53,0.18)] overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 bg-[#F8FBFD] border-b border-[#F0F4F8] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[10px] bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center">
                  <Building2 size={17} />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-[#172A3A]">
                    Lịch sử xét sơ tuyển cấp Trường
                  </h2>
                  <p className="text-[12px] text-[#607483]">
                    Thông tin thẩm định sơ tuyển được lưu trữ nguyên trạng (Chế độ chỉ đọc)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseSchoolHistory}
                className="p-1.5 rounded-[10px] text-[#526B7C] hover:text-[#0F2335] hover:bg-[#EEF3F7] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-[13px] text-[#172A3A]">
              <div className="p-3.5 rounded-[12px] bg-[#F5F8FB] space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[12.5px]">
                  <div>
                    <span className="text-[#607483] block text-[11px]">
                      Đơn vị xét sơ tuyển:
                    </span>
                    <strong className="text-[#172A3A]">
                      {applicationRecord.schoolReviewSummary
                        ?.schoolReviewUnitName || 'Đại học Đà Nẵng'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#607483] block text-[11px]">
                      Cán bộ xét sơ tuyển:
                    </span>
                    <strong className="text-[#172A3A]">
                      {applicationRecord.schoolReviewSummary?.forwardedByName ||
                        'Cán bộ xét cấp trường Đại học Đà Nẵng'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#607483] block text-[11px]">
                      Ngày chuyển cấp ĐHĐN:
                    </span>
                    <span className="font-semibold tabular-nums text-[#172A3A]">
                      {applicationRecord.schoolReviewSummary?.forwardedAt ||
                        '15/10/2026 · 14:30'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#607483] block text-[11px]">
                      Kết luận sơ tuyển:
                    </span>
                    <span className="font-bold text-[#15803D]">
                      Đề xuất chuyển cấp ĐHĐN
                    </span>
                  </div>
                </div>

                {applicationRecord.schoolReviewSummary?.snapshot
                  ?.summaryNotes && (
                  <div className="pt-2 border-t border-[#E2EDF5] text-[12.5px] text-[#334E68]">
                    <span className="font-semibold text-[#172A3A]">
                      Nhận xét đơn vị:{' '}
                    </span>
                    {
                      applicationRecord.schoolReviewSummary.snapshot
                        .summaryNotes
                    }
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-[12px] font-bold text-[#607483] uppercase tracking-wider">
                  Kết quả rà soát 05 tiêu chí cấp Trường
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CRITERIA_LIST.map((crit) => (
                    <div
                      key={crit.id}
                      className="p-2.5 rounded-[10px] bg-white border border-[#E2EDF5] flex items-center justify-between gap-2"
                    >
                      <span className="text-[12.5px] font-semibold text-[#172A3A]">
                        {crit.number}. {crit.name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#15803D] bg-[#EAFBF1] px-2 py-0.5 rounded-[5px]">
                        <CheckCircle2 size={12} />
                        <span>Đạt chuẩn</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-[12px] bg-[#EFF6FF] border border-[#BFDBFE] text-[12px] text-[#1D4ED8] flex items-start gap-2">
                <Info size={15} className="shrink-0 mt-0.5" />
                <span>
                  Lưu ý nghiệp vụ: Toàn bộ thông tin xét sơ tuyển mang tính chất tham khảo chuyên môn. Cán bộ xét duyệt cấp Đại học Đà Nẵng chịu trách nhiệm thẩm định độc lập và đưa ra kết luận riêng.
                </span>
              </div>
            </div>

            <div className="p-4 bg-[#F8FBFD] border-t border-[#F0F4F8] flex justify-end shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={onCloseSchoolHistory}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
