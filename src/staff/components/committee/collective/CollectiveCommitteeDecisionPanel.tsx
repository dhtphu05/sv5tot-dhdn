import React from 'react';
import {
  Scale,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { CollectiveApplication } from '../../../collectiveTypes';
import { StaffUser } from '../../../types';
import { Button } from '../../../../components/buttons/Button';

export interface CollectiveCommitteeDecisionPanelProps {
  appData: CollectiveApplication;
  currentUser: {
    fullName: string;
    roleLabel: string;
    primaryRole?: string;
  };
  outcome: 'recognized' | 'not_recognized' | 'needs_consideration';
  setOutcome: (val: 'recognized' | 'not_recognized' | 'needs_consideration') => void;
  notes: string;
  setNotes: (val: string) => void;
  saveSuccessMsg: string | null;
  actionErrorMsg: string | null;
  onSaveDecision: () => void;
  onFinalize: () => void;
  onOpenPublishModal: () => void;
}

export const CollectiveCommitteeDecisionPanel: React.FC<CollectiveCommitteeDecisionPanelProps> = ({
  appData,
  currentUser,
  outcome,
  setOutcome,
  notes,
  setNotes,
  saveSuccessMsg,
  actionErrorMsg,
  onSaveDecision,
  onFinalize,
  onOpenPublishModal,
}) => {
  return (
    <aside className="w-[360px] shrink-0 bg-white border-l border-[#D4E2EC] flex flex-col justify-between overflow-y-auto">
      <div className="p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-[#DCE7EE] pb-3">
          <div className="flex items-center gap-2">
            <Scale size={18} className="text-[#0B64A0]" />
            <h3 className="font-extrabold text-[15px] text-[#0F2335]">
              Kết luận của Hội đồng
            </h3>
          </div>
          <span className="text-[11px] font-bold text-[#526B7C]">
            Cấp Đại học Đà Nẵng
          </span>
        </div>

        {saveSuccessMsg && (
          <div className="p-3 bg-[#EDF9F1] border border-[#C6EED5] text-[#16A34A] text-[12px] font-bold rounded-[8px] flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {actionErrorMsg && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-[12px] font-bold rounded-[8px] flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{actionErrorMsg}</span>
          </div>
        )}

        {/* Decision Outcome Selector */}
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-bold text-[#172A3A] mb-2">
              Quyết nghị của Hội đồng:
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setOutcome('recognized')}
                className={`w-full p-2.5 rounded-[9px] border text-left font-bold transition-all cursor-pointer ${
                  outcome === 'recognized'
                    ? 'bg-[#EDF9F1] border-[#16A34A] text-[#16A34A] shadow-xs'
                    : 'bg-white border-[#DCE7EE] text-[#475569] hover:bg-[#F8FBFD]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} />
                  <span className="text-[13px]">Đạt danh hiệu</span>
                </div>
                <div className="text-[11px] font-normal text-[#15803D] mt-0.5">
                  Đề nghị công nhận Tập thể Sinh viên 5 tốt
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOutcome('not_recognized')}
                className={`w-full p-2.5 rounded-[9px] border text-left font-bold transition-all cursor-pointer ${
                  outcome === 'not_recognized'
                    ? 'bg-[#FEF2F2] border-[#DC2626] text-[#DC2626] shadow-xs'
                    : 'bg-white border-[#DCE7EE] text-[#475569] hover:bg-[#F8FBFD]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <X size={15} />
                  <span className="text-[13px]">Chưa đạt danh hiệu</span>
                </div>
                <div className="text-[11px] font-normal text-[#991B1B] mt-0.5">
                  Chưa đáp ứng đủ tiêu chuẩn xét chọn
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOutcome('needs_consideration')}
                className={`w-full p-2.5 rounded-[9px] border text-left font-bold transition-all cursor-pointer ${
                  outcome === 'needs_consideration'
                    ? 'bg-[#EAF6FC] border-[#0D78AE] text-[#0D78AE] shadow-xs'
                    : 'bg-white border-[#DCE7EE] text-[#475569] hover:bg-[#F8FBFD]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Clock size={15} />
                  <span className="text-[13px]">Tạm hoãn / Cần xem xét thêm</span>
                </div>
                <div className="text-[11px] font-normal text-[#0369A1] mt-0.5">
                  Cần làm rõ thêm tài liệu hoặc biểu quyết lại
                </div>
              </button>
            </div>
          </div>

          {/* Reasoned Note Field */}
          <div>
            <label className="block text-[12px] font-bold text-[#172A3A] mb-1.5">
              Căn cứ kết luận / Biên bản Hội đồng:
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full p-2.5 bg-white border border-[#DCE7EE] rounded-[8px] text-[12.5px] text-[#172A3A] outline-none focus:border-[#0D78AE]"
              placeholder="Nhập ghi chú căn cứ kết luận của Hội đồng..."
            />
          </div>

          <Button
            variant="primary"
            onClick={onSaveDecision}
            className="w-full justify-center h-[38px] font-bold text-[13px]"
          >
            Lưu kết luận Hội đồng
          </Button>
        </div>

        {/* Formal Finalization & Publication Flow */}
        <div className="pt-4 border-t border-[#DCE7EE] space-y-3">
          <div className="text-[12px] font-extrabold text-[#0F2335]">
            Quy trình Hoàn tất &amp; Công bố
          </div>

          <div className="space-y-2 text-[12px]">
            <div className="flex items-center justify-between p-2 rounded bg-[#F8FBFD] border border-[#E2EDF5]">
              <span className="text-[#4A6275]">1. Kết luận Hội đồng:</span>
              <span className="font-bold text-[#15803D]">
                {appData.committeeOutcome ? 'Đã ghi nhận' : 'Chưa ghi nhận'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-[#F8FBFD] border border-[#E2EDF5]">
              <span className="text-[#4A6275]">2. Hoàn tất quyết định:</span>
              <span className="font-bold text-[#0B64A0]">
                {appData.status === 'finalized' || appData.status === 'published'
                  ? 'Đã hoàn tất'
                  : 'Chưa chốt'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-[#F8FBFD] border border-[#E2EDF5]">
              <span className="text-[#4A6275]">3. Công bố kết quả:</span>
              <span className="font-bold text-[#136F3A]">
                {appData.status === 'published' ? 'Đã công bố' : 'Chưa công bố'}
              </span>
            </div>
          </div>

          {appData.status !== 'published' && (
            <div className="space-y-2 pt-1">
              {appData.status !== 'finalized' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onFinalize}
                  disabled={!appData.committeeOutcome}
                  className="w-full justify-center"
                >
                  Hoàn tất quyết định
                </Button>
              )}

              <Button
                variant="primary"
                size="sm"
                onClick={onOpenPublishModal}
                disabled={!appData.committeeOutcome}
                className="w-full justify-center"
              >
                Công bố kết quả chính thức
              </Button>
            </div>
          )}

          {appData.status === 'published' && (
            <div className="p-3 rounded-[8px] bg-[#EDF9F1] border border-[#C6EED5] text-[12px] text-[#15803D] flex items-start gap-2">
              <ShieldCheck size={16} className="shrink-0 mt-0.5" />
              <div>
                <strong>Đã công bố chính thức.</strong> Kết quả đã hiển thị trên Cổng tập thể của {appData.collectiveName}.
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-3.5 border-t border-[#D4E2EC] bg-[#FAFCFD] text-[11px] text-[#607483]">
        Cán bộ ghi nhận: <strong>{currentUser.fullName}</strong> ({currentUser.roleLabel})
      </div>
    </aside>
  );
};
