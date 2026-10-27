/**
 * 5TOT ĐHĐN — Collective Pre-Submission Audit Dialog
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt S4.8 v2 Sections 38, 39, 40:
 * - Checks 4 requirements completeness before sending to responsible institution.
 * - Displays exact figures (42/42 = 100%, 9/42 = 21.43%) and evidence counts.
 * - Explains locking semantics.
 */

import React from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building2,
  Users,
  Award,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { CollectiveApplication, COLLECTIVE_TYPE_LABELS } from '../../staff/collectiveTypes';
import { Button } from '../buttons/Button';

export interface CollectivePreSubmitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  application: CollectiveApplication;
  onConfirmSubmit: () => void;
  onSelectRequirement?: (reqId: 'TT01' | 'TT02' | 'TT03' | 'TT04') => void;
}

export const CollectivePreSubmitDialog: React.FC<CollectivePreSubmitDialogProps> = ({
  isOpen,
  onClose,
  application,
  onConfirmSubmit,
  onSelectRequirement,
}) => {
  if (!isOpen) return null;

  const { tt01, tt02, tt03, tt04 } = application;

  // Compute rates & checks
  const tt01Valid = Boolean(tt01.isRecognizedSchoolLevel && (tt01.evidenceFiles?.length || 0) > 0);
  const participationRate =
    tt02.totalMembers > 0 ? (tt02.participatingCount / tt02.totalMembers) * 100 : 0;
  const tt02Valid = Boolean(tt02.totalMembers > 0 && tt02.participatingCount === tt02.totalMembers);

  const recognitionRate =
    tt02.totalMembers > 0 ? (tt03.recognizedCount / tt02.totalMembers) * 100 : 0;
  const tt03Valid = Boolean(
    tt02.totalMembers > 0 && tt03.recognizedCount * 100 >= tt02.totalMembers * 20
  );

  const tt04Valid = Boolean(tt04.noViolationsConfirmed && (tt04.evidenceFiles?.length || 0) > 0);

  const totalEvidenceCount =
    (tt01.evidenceFiles?.length || 0) +
    (tt02.evidenceFiles?.length || 0) +
    (tt03.evidenceFiles?.length || 0) +
    (tt04.evidenceFiles?.length || 0);

  const warnings: { reqId: 'TT01' | 'TT02' | 'TT03' | 'TT04'; text: string }[] = [];
  if (!tt01Valid) {
    warnings.push({
      reqId: 'TT01',
      text: 'TT01: Chưa có tài liệu minh chứng công nhận cấp Trường hoặc chưa khai báo.',
    });
  }
  if (!tt02Valid) {
    warnings.push({
      reqId: 'TT02',
      text: `TT02: Số liệu kê khai hiện đạt ${participationRate.toFixed(1)}%, thấp hơn ngưỡng 100% theo quy định.`,
    });
  }
  if (!tt03Valid) {
    warnings.push({
      reqId: 'TT03',
      text: `TT03: Số liệu kê khai hiện đạt ${recognitionRate.toFixed(2)}%, thấp hơn ngưỡng tối thiểu 20% (${tt03.recognizedCount}/${tt02.totalMembers} SV).`,
    });
  }
  if (!tt04Valid) {
    warnings.push({
      reqId: 'TT04',
      text: 'TT04: Chưa bổ sung xác nhận của đơn vị về việc không có sinh viên vi phạm kỷ luật.',
    });
  }
  if (totalEvidenceCount === 0) {
    warnings.push({
      reqId: 'TT01',
      text: 'Hồ sơ chưa đính kèm tệp tài liệu minh chứng nào.',
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-2xl bg-white rounded-[16px] shadow-2xl border border-[#DCE7EE] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#F8FBFD] border-b border-[#DCE7EE] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-[#EAF6FC] text-[#0D78AE] flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-[#172A3A]">
                Xác nhận nộp hồ sơ Tập thể Sinh viên 5 tốt
              </h2>
              <p className="text-[12px] text-[#607483]">
                {COLLECTIVE_TYPE_LABELS[application.collectiveType]}: {application.collectiveName} · {application.institutionName} · Năm học {application.academicYear}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[6px] text-[#728391] hover:text-[#172A3A] hover:bg-[#EEF4F8] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Audit Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-[13px]">
          {/* Section 45 Regulatory Notice Body */}
          <div className="p-3.5 bg-[#F4F9FD] border border-[#CFE3F0] rounded-[10px] text-[12.5px] text-[#0B64A0] space-y-2">
            <div className="flex items-start gap-2.5">
              <Building2 size={16} className="shrink-0 mt-0.5 text-[#0D78AE]" />
              <div className="leading-relaxed">
                <p className="text-[#172A3A]">
                  Bạn đang nộp hồ sơ của <strong>{application.collectiveName}</strong> năm học <strong>{application.academicYear}</strong> trực tiếp đến <strong>Hội Sinh viên Việt Nam Đại học Đà Nẵng</strong> để xét chọn.
                </p>
                <p className="mt-1 text-[#4A6275]">
                  Sau khi nộp, thông tin hồ sơ sẽ được khóa chỉnh sửa thông thường. Bạn chỉ có thể bổ sung hoặc điều chỉnh nội dung trong phạm vi yêu cầu bổ sung hợp lệ.
                </p>
              </div>
            </div>
          </div>

          {/* Key Summary Strip */}
          <div className="grid grid-cols-3 gap-2.5 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-center text-[12px]">
            <div>
              <span className="text-[#607483] block">Tập thể</span>
              <strong className="text-[#172A3A] truncate block">{application.collectiveName}</strong>
            </div>
            <div>
              <span className="text-[#607483] block">Năm học</span>
              <strong className="text-[#172A3A] block">{application.academicYear}</strong>
            </div>
            <div>
              <span className="text-[#607483] block">Tổng số minh chứng</span>
              <strong className="text-[#0D78AE] block">{totalEvidenceCount} tệp tài liệu</strong>
            </div>
          </div>

          {/* 4 Requirements Checklist */}
          <div className="border border-[#DCE7EE] rounded-[12px] overflow-hidden divide-y divide-[#E3EBF1]">
            {/* TT01 */}
            <div className="p-3.5 flex items-center justify-between gap-3 bg-white">
              <div className="flex items-center gap-2.5 min-w-0">
                {tt01Valid ? (
                  <CheckCircle2 size={18} className="text-[#16A34A] shrink-0" />
                ) : (
                  <AlertTriangle size={18} className="text-[#D97706] shrink-0" />
                )}
                <div className="truncate">
                  <div className="font-bold text-[#172A3A]">TT01 — Công nhận danh hiệu cấp Trường</div>
                  <div className="text-[12px] text-[#607483] truncate">
                    {tt01.isRecognizedSchoolLevel
                      ? `QĐ: ${tt01.decisionNumber || 'Đã khai báo'} · ${tt01.issuingUnitName || 'Cấp Trường'}`
                      : 'Chưa khai báo hoặc chưa đạt'}
                  </div>
                </div>
              </div>
              <span className="text-[11.5px] font-semibold text-[#4A6275] bg-[#F1F5F9] px-2 py-0.5 rounded-[5px] shrink-0">
                {tt01.evidenceFiles?.length || 0} minh chứng
              </span>
            </div>

            {/* TT02 */}
            <div className="p-3.5 flex items-center justify-between gap-3 bg-white">
              <div className="flex items-center gap-2.5 min-w-0">
                {tt02Valid ? (
                  <CheckCircle2 size={18} className="text-[#16A34A] shrink-0" />
                ) : (
                  <AlertTriangle size={18} className="text-[#D97706] shrink-0" />
                )}
                <div className="truncate">
                  <div className="font-bold text-[#172A3A]">TT02 — 100% sinh viên tham gia phong trào</div>
                  <div className="text-[12px] text-[#607483] truncate">
                    Đạt: {tt02.participatingCount}/{tt02.totalMembers} sinh viên ({participationRate.toFixed(1)}% / Ngưỡng: 100%)
                  </div>
                </div>
              </div>
              <span className="text-[11.5px] font-semibold text-[#4A6275] bg-[#F1F5F9] px-2 py-0.5 rounded-[5px] shrink-0">
                {tt02.evidenceFiles?.length || 0} minh chứng
              </span>
            </div>

            {/* TT03 */}
            <div className="p-3.5 flex items-center justify-between gap-3 bg-white">
              <div className="flex items-center gap-2.5 min-w-0">
                {tt03Valid ? (
                  <CheckCircle2 size={18} className="text-[#16A34A] shrink-0" />
                ) : (
                  <AlertTriangle size={18} className="text-[#D97706] shrink-0" />
                )}
                <div className="truncate">
                  <div className="font-bold text-[#172A3A]">TT03 — Ít nhất 20% thành viên đạt SV5T cấp Trường</div>
                  <div className="text-[12px] text-[#607483] truncate">
                    Đạt: {tt03.recognizedCount}/{tt02.totalMembers} sinh viên ({recognitionRate.toFixed(2)}% / Ngưỡng: &ge; 20%)
                  </div>
                </div>
              </div>
              <span className="text-[11.5px] font-semibold text-[#4A6275] bg-[#F1F5F9] px-2 py-0.5 rounded-[5px] shrink-0">
                {tt03.evidenceFiles?.length || 0} minh chứng
              </span>
            </div>

            {/* TT04 */}
            <div className="p-3.5 flex items-center justify-between gap-3 bg-white">
              <div className="flex items-center gap-2.5 min-w-0">
                {tt04Valid ? (
                  <CheckCircle2 size={18} className="text-[#16A34A] shrink-0" />
                ) : (
                  <AlertTriangle size={18} className="text-[#D97706] shrink-0" />
                )}
                <div className="truncate">
                  <div className="font-bold text-[#172A3A]">TT04 — Chấp hành pháp luật và các quy định</div>
                  <div className="text-[12px] text-[#607483] truncate">
                    {tt04.noViolationsConfirmed
                      ? `Xác nhận không vi phạm · Đơn vị: ${tt04.confirmingUnitName || 'Khoa'}`
                      : 'Chưa có xác nhận'}
                  </div>
                </div>
              </div>
              <span className="text-[11.5px] font-semibold text-[#4A6275] bg-[#F1F5F9] px-2 py-0.5 rounded-[5px] shrink-0">
                {tt04.evidenceFiles?.length || 0} minh chứng
              </span>
            </div>
          </div>

          {/* Warnings List if any */}
          {warnings.length > 0 && (
            <div className="p-3.5 bg-[#FEF6EB] border border-[#FADDB6] rounded-[10px] space-y-1.5 text-[12px] text-[#8C3A19]">
              <div className="font-bold flex items-center gap-1.5 text-[#B75B00]">
                <AlertTriangle size={14} />
                <span>Cảnh báo điều kiện xét chọn cần kiểm tra:</span>
              </div>
              <div className="space-y-1">
                {warnings.map((w, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if (onSelectRequirement) {
                        onSelectRequirement(w.reqId);
                        onClose();
                      }
                    }}
                    className={`pl-3 flex items-start gap-1.5 ${
                      onSelectRequirement ? 'cursor-pointer hover:underline text-[#9A3412]' : ''
                    }`}
                  >
                    <span>•</span>
                    <span>{w.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#F8FBFD] border-t border-[#DCE7EE] flex items-center justify-between gap-3">
          <Button type="button" variant="quiet" onClick={onClose}>
            Quay lại
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirmSubmit}
            className="gap-1.5"
          >
            <Send size={15} />
            <span>Xác nhận nộp hồ sơ</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
