/**
 * 5TOT ĐHĐN — Committee Decision Controls Bar (SRW-2)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements concise, authorized Committee controls over the shared canonical dossier:
 * - Read-only inspection of student submission
 * - Recorded School & City evaluation summary
 * - Flagged items notice (if any)
 * - Official Committee decision recording (Công nhận / Không công nhận)
 * - Internal decision note
 */

import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Bot,
  Sparkles,
  FileCheck2,
} from 'lucide-react';
import {
  CommitteeCaseDetail,
  CommitteeDecisionOutcome,
} from '../../staff/committeeTypes';
import { StaffApplicationRecord } from '../../staff/types';
import { Button } from '../buttons/Button';

export interface DossierCommitteeDecisionBarProps {
  application: StaffApplicationRecord;
  caseDetail: CommitteeCaseDetail;
  canRecordDecision: boolean;
  onRecordDecision: (
    applicationId: string,
    outcome: CommitteeDecisionOutcome,
    internalNote: string
  ) => void;
  onOpenSecretaryReport?: () => void;
  className?: string;
}

export const DossierCommitteeDecisionBar: React.FC<
  DossierCommitteeDecisionBarProps
> = ({
  application,
  caseDetail,
  canRecordDecision,
  onRecordDecision,
  onOpenSecretaryReport,
  className = '',
}) => {
  const [outcome, setOutcome] = useState<CommitteeDecisionOutcome>(
    caseDetail.decision?.outcome || 'recognized'
  );
  const [internalNote, setInternalNote] = useState<string>(
    caseDetail.decision?.internalNote ||
      'Hội đồng đã xem xét hồ sơ, đối chiếu minh chứng gốc và thống nhất biểu quyết.'
  );
  const [isSaved, setIsSaved] = useState<boolean>(!!caseDetail.decision);

  React.useEffect(() => {
    setOutcome(caseDetail.decision?.outcome || 'recognized');
    setInternalNote(
      caseDetail.decision?.internalNote ||
        'Hội đồng đã xem xét hồ sơ, đối chiếu minh chứng gốc và thống nhất biểu quyết.'
    );
    setIsSaved(!!caseDetail.decision);
  }, [application.applicationId, caseDetail.decision]);

  const handleSaveDecision = () => {
    onRecordDecision(application.applicationId, outcome, internalNote);
    setIsSaved(true);
  };

  const flaggedCount = caseDetail.flaggedItems?.length || 0;
  const pendingFlaggedCount =
    caseDetail.flaggedItems?.filter((f) => f.status === 'pending_consideration')
      .length || 0;

  return (
    <div
      className={`bg-white rounded-[14px] border border-[#DCE7EE] shadow-sm p-4 space-y-3.5 ${className}`}
    >
      {/* Top Bar: Context & Recorded Appraisals */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6EFF5] pb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-[#0D78AE]" />
            <span className="text-[13.5px] font-bold text-[#172A3A]">
              Hội đồng xét chọn cấp Đại học Đà Nẵng
            </span>
          </div>

          <span className="text-[#C2D4E3]">·</span>
          <span className="text-[12px] text-[#526B7C]">
            Cán bộ thẩm định:{' '}
            <strong className="text-[#172A3A]">
              {application.assignment?.officerName || 'Trần Hoàng Nam'}
            </strong>
          </span>

          <span className="text-[#C2D4E3]">·</span>
          <span className="text-[12px] text-[#136F3A] font-semibold">
            Đã hoàn tất thẩm định 05/05 tiêu chí
          </span>
        </div>

        {/* Quiet AI Secretary report entry */}
        {onOpenSecretaryReport && (
          <button
            type="button"
            onClick={onOpenSecretaryReport}
            className="inline-flex items-center gap-1.5 h-[32px] px-3 rounded-[8px] border border-[#CFE0EC] bg-[#F8FBFD] hover:bg-[#EFF6FB] text-[#0D78AE] font-bold text-[12px] transition-colors cursor-pointer"
          >
            <Bot size={14} />
            <span>AI Thư ký hội đồng</span>
          </button>
        )}
      </div>

      {/* Flagged items warning if any */}
      {flaggedCount > 0 && (
        <div className="p-2.5 px-3 rounded-[8px] bg-[#FEF6EB] border border-[#FADDB6] text-[#92400E] text-[12px] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-[#D97706] shrink-0" />
            <span>
              Hồ sơ có <strong>{flaggedCount} nội dung</strong> được Cán bộ ghi chú cần Hội đồng đối chiếu ({pendingFlaggedCount} chưa xử lý).
            </span>
          </div>
        </div>
      )}

      {/* Decision Action Area */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-[13px] font-bold text-[#172A3A]">
            Kết luận của Hội đồng:
          </span>

          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              disabled={!canRecordDecision || caseDetail.isPublished}
              onClick={() => {
                setOutcome('recognized');
                setIsSaved(false);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12.5px] font-bold border transition-all cursor-pointer ${
                outcome === 'recognized'
                  ? 'bg-[#EBFBF2] text-[#136F3A] border-[#86EFAC] shadow-2xs'
                  : 'bg-white text-[#4A6275] border-[#DCE7EE] hover:bg-[#F6FAF8]'
              }`}
            >
              <CheckCircle2
                size={14}
                className={outcome === 'recognized' ? 'text-[#16A34A]' : 'text-[#8295A5]'}
              />
              <span>Công nhận Danh hiệu</span>
            </button>

            <button
              type="button"
              disabled={!canRecordDecision || caseDetail.isPublished}
              onClick={() => {
                setOutcome('not_recognized');
                setIsSaved(false);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12.5px] font-bold border transition-all cursor-pointer ${
                outcome === 'not_recognized'
                  ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5] shadow-2xs'
                  : 'bg-white text-[#4A6275] border-[#DCE7EE] hover:bg-[#FEF6F6]'
              }`}
            >
              <XCircle
                size={14}
                className={outcome === 'not_recognized' ? 'text-[#DC2626]' : 'text-[#8295A5]'}
              />
              <span>Không công nhận</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!caseDetail.isPublished && (
            <Button
              variant="primary"
              size="sm"
              disabled={!canRecordDecision}
              onClick={handleSaveDecision}
              iconLeading={<FileCheck2 size={14} />}
            >
              {isSaved ? 'Cập nhật kết luận' : 'Ghi nhận kết luận xét chọn'}
            </Button>
          )}

          {caseDetail.isPublished && (
            <span className="text-[12px] font-bold px-3 py-1 rounded-[7px] bg-[#EBFBF2] text-[#136F3A] border border-[#86EFAC]">
              Đã ban hành kết quả chính thức
            </span>
          )}
        </div>
      </div>

      {/* Decision Note */}
      <div className="pt-0.5">
        <input
          type="text"
          value={internalNote}
          onChange={(e) => {
            setInternalNote(e.target.value);
            setIsSaved(false);
          }}
          disabled={!canRecordDecision || caseDetail.isPublished}
          placeholder="Nhập căn cứ / ghi chú kết luận của Hội đồng..."
          className="w-full h-[36px] px-3.5 rounded-[8px] border border-[#C5D9E8] bg-[#F8FBFD] text-[12.5px] text-[#172A3A] focus:outline-none focus:border-[#0D78AE] focus:bg-white transition-colors"
        />
      </div>
    </div>
  );
};
