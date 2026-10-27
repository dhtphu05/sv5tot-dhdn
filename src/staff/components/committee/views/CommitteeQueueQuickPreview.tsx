import React from 'react';
import { Sparkles } from 'lucide-react';
import { StaffApplicationRecord, StaffUser } from '../../../types';
import { CommitteeCaseDetail } from '../../../committeeTypes';
import {
  canRecordCommitteeDecision,
  getCommitteeWorkflowStatusMeta,
} from '../../../committeeSelectors';
import { Button } from '../../../../components/buttons/Button';
import { deriveApplicationCriteriaReviewProgress } from '../../../criteriaProgress';

export interface CommitteeQueueQuickPreviewProps {
  currentUser: StaffUser;
  selectedRowApp: StaffApplicationRecord | null;
  selectedRowCase: CommitteeCaseDetail | null;
  onOpenApplicationWorkspace: (applicationId: string) => void;
  onOpenDecisionTargetModal: (app: StaffApplicationRecord) => void;
  onOpenSecretaryReport?: (app: StaffApplicationRecord) => void;
}

export const CommitteeQueueQuickPreview: React.FC<CommitteeQueueQuickPreviewProps> = ({
  currentUser,
  selectedRowApp,
  selectedRowCase,
  onOpenApplicationWorkspace,
  onOpenDecisionTargetModal,
  onOpenSecretaryReport,
}) => {
  if (!selectedRowApp) return null;

  const statusMeta = getCommitteeWorkflowStatusMeta(
    selectedRowCase,
    selectedRowApp
  );

  const decisionAllowed = selectedRowCase
    ? canRecordCommitteeDecision(currentUser, selectedRowCase).allowed
    : false;

  const flags = selectedRowCase?.flaggedItems || [];

  return (
    <div className="bg-white rounded-[12px] border border-[#CFE0EC] p-4 space-y-3.5 shadow-2xs">
      <div className="flex items-start justify-between gap-2 border-b border-[#E6EFF5] pb-3">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#0B64A0]">
            Tóm tắt hồ sơ đang chọn
          </div>
          <h3 className="text-[15px] font-extrabold text-[#0F2335] mt-0.5">
            {selectedRowApp.student.fullName}
          </h3>
          <div className="text-[12px] text-[#526B7C] font-mono">
            MSSV: {selectedRowApp.student.studentCode}
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] text-[11px] font-bold border shrink-0"
          style={{
            backgroundColor: statusMeta.badgeBg,
            color: statusMeta.badgeText,
            borderColor: statusMeta.badgeBorder,
          }}
        >
          {statusMeta.label}
        </span>
      </div>

      <div className="space-y-1.5 text-[12px]">
        <div className="text-[#526B7C]">
          Đơn vị:{' '}
          <strong className="text-[#172A3A]">
            {selectedRowApp.institution.officialName}
          </strong>
        </div>
        <div className="text-[#526B7C]">
          Cán bộ thẩm định:{' '}
          <strong className="text-[#172A3A]">
            {selectedRowApp.assignment?.officerName || 'Trần Hoàng Nam'}
          </strong>
        </div>
      </div>

      <div className="space-y-1.5 text-[12px] bg-[#F8FAFC] p-3 rounded-[9px] border border-[#E2E8F0]">
        <div className="flex items-center justify-between text-[#526B7C]">
          <span>Đề xuất cơ sở:</span>
          <span className="font-bold text-[#0B64A0]">
            {selectedRowApp.schoolPreliminaryStatus === 'not_recommended'
              ? 'Không đề xuất'
              : selectedRowApp.schoolPreliminaryStatus === 'recommended_forwarding' ||
                selectedRowApp.schoolPreliminaryStatus === 'forwarded_to_city'
              ? 'Đạt sơ tuyển (Đề xuất)'
              : 'Chưa kết luận'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[#526B7C]">
          <span>Thẩm định cấp ĐHĐN:</span>
          <span className="font-bold text-[#136F3A]">
            {(() => {
              const prg = deriveApplicationCriteriaReviewProgress(selectedRowApp);
              return prg.isAllMet ? '05 / 05 tiêu chí Đạt' : prg.compactProgressLabel;
            })()}
          </span>
        </div>
        <div className="flex items-center justify-between text-[#526B7C]">
          <span>Cán bộ thẩm định:</span>
          <span className="font-bold text-[#172A3A]">
            {selectedRowApp.assignment?.officerName || 'Tổ thẩm định cấp Đại học Đà Nẵng'}
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-[#E6EFF5] flex flex-col gap-2">
        {onOpenSecretaryReport && (
          <button
            type="button"
            onClick={() => onOpenSecretaryReport(selectedRowApp)}
            className="w-full inline-flex items-center justify-center gap-1.5 h-[34px] px-3 rounded-[8px] bg-linear-to-r from-[#0284C7] to-[#0D78AE] hover:from-[#0369A1] hover:to-[#095284] text-white text-[12px] font-bold shadow-xs transition-all cursor-pointer"
          >
            <Sparkles size={13} className="text-[#BAE6FD]" />
            <span>AI báo cáo hồ sơ cho Hội đồng</span>
          </button>
        )}
        {selectedRowCase && !selectedRowCase.decision && decisionAllowed ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onOpenDecisionTargetModal(selectedRowApp)}
            className="w-full justify-center"
          >
            Ghi nhận kết luận xét chọn
          </Button>
        ) : selectedRowCase?.decision ? (
          <div className="text-[12px] text-center text-[#526B7C] py-1.5 bg-[#F1F5F9] rounded-[6px] font-medium border border-[#E2E8F0]">
            Hồ sơ đã ghi nhận kết luận Hội đồng
          </div>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              onOpenApplicationWorkspace(selectedRowApp.applicationId)
            }
            className="w-full justify-center"
          >
            Xem hồ sơ chi tiết
          </Button>
        )}
      </div>
    </div>
  );
};
