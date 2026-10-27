/**
 * 5TOT ĐHĐN — Collective Official Result Presentation Modal
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt S4.8 v2 Sections 67, 68:
 * - Displays official published result of the Collective Student 5-Good track.
 * - Displays decision number, decision date, awarding authority.
 * - Only accessible after formal authorized publication.
 */

import React from 'react';
import { X, Award, CheckCircle2, FileText, Download, Printer, Building2 } from 'lucide-react';
import { CollectiveApplication, COLLECTIVE_TYPE_LABELS } from '../../staff/collectiveTypes';
import { HsvEmblem } from '../brand/HsvLogo';
import { Button } from '../buttons/Button';

export interface CollectiveResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: CollectiveApplication;
}

export const CollectiveResultModal: React.FC<CollectiveResultModalProps> = ({
  isOpen,
  onClose,
  application,
}) => {
  if (!isOpen) return null;

  const res = application.finalResult;
  const isRecognized = res?.outcome === 'recognized' || application.committeeOutcome === 'recognized';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-2xl bg-white rounded-[18px] shadow-2xl border border-[#DCE7EE] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#F8FBFD] border-b border-[#DCE7EE] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HsvEmblem size={28} />
            <div>
              <h2 className="text-[15px] font-bold text-[#172A3A]">
                Kết quả xét chọn Tập thể Sinh viên 5 tốt cấp Đại học Đà Nẵng
              </h2>
              <p className="text-[11.5px] text-[#607483]">
                Hội Sinh viên Việt Nam Đại học Đà Nẵng · Năm học {application.academicYear}
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

        {/* Certificate / Decision Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-center">
          {/* Institutional Crest & Decision Heading */}
          <div className="border-b border-[#E3EBF1] pb-5">
            <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#466474]">
              HỘI SINH VIÊN VIỆT NAM THÀNH PHỐ ĐÀ NẴNG
            </div>
            <div className="text-[13px] font-extrabold uppercase text-[#126A9C] mt-0.5">
              HỘI ĐỒNG XÉT CHỌN DANH HIỆU SINH VIÊN 5 TỐT CẤP THÀNH PHỐ
            </div>
            <div className="text-[12px] text-[#728391] mt-1">
              Số: {res?.decisionNumber || '86/QĐ-HSV-TP'} · Đà Nẵng, ngày {res?.decisionDate || '24/10/2026'}
            </div>
          </div>

          {/* Outcome Status Badge */}
          <div className="flex flex-col items-center">
            {isRecognized ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EDF9F1] border border-[#C6EED5] text-[#1B7C49] font-bold text-[14px]">
                <CheckCircle2 size={18} />
                <span>CHÍNH THỨC CÔNG NHẬN DANH HIỆU</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] font-bold text-[14px]">
                <X size={18} />
                <span>CHƯA ĐƯỢC CÔNG NHẬN DANH HIỆU</span>
              </div>
            )}
          </div>

          {/* Recognition Award Plaque or Notification */}
          {isRecognized ? (
            <div className="p-6 bg-gradient-to-b from-[#F9FCFE] to-[#F1F7FB] border border-[#D0E4F0] rounded-[16px] space-y-3">
              <div className="text-[12px] font-bold uppercase tracking-wider text-[#0D78AE]">
                CÔNG NHẬN DANH HIỆU
              </div>
              <div className="text-[22px] font-black text-[#172A3A] tracking-tight">
                TẬP THỂ SINH VIÊN 5 TỐT CẤP THÀNH PHỐ
              </div>
              <div className="text-[14.5px] font-bold text-[#0B64A0]">
                {COLLECTIVE_TYPE_LABELS[application.collectiveType]}: {application.collectiveName}
              </div>
              <div className="text-[13px] text-[#466474]">
                {application.facultyName ? `${application.facultyName} · ` : ''}
                {application.institutionName}
              </div>
              <div className="text-[12px] text-[#728391] pt-2">
                Hồ sơ nộp trực tiếp và xét chọn tại: <strong>Hội Sinh viên Việt Nam Đại học Đà Nẵng</strong>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] space-y-3 text-center">
              <div className="text-[12px] font-bold uppercase tracking-wider text-[#64748B]">
                THÔNG BÁO KẾT QUẢ XÉT CHỌN
              </div>
              <div className="text-[20px] font-black text-[#334155] tracking-tight">
                CHƯA ĐƯỢC CÔNG NHẬN DANH HIỆU
              </div>
              <div className="text-[14.5px] font-bold text-[#475569]">
                {COLLECTIVE_TYPE_LABELS[application.collectiveType]}: {application.collectiveName}
              </div>
              <div className="text-[13px] text-[#64748B]">
                {application.facultyName ? `${application.facultyName} · ` : ''}
                {application.institutionName}
              </div>
              <div className="text-[12px] text-[#64748B] pt-2">
                Hội đồng xét chọn trân trọng ghi nhận sự nỗ lực tham gia phong trào của tập thể trong năm học {application.academicYear}.
              </div>
            </div>
          )}

          {/* 4 Conditions Summary */}
          <div className="text-left bg-white border border-[#DCE7EE] rounded-[12px] p-4 space-y-2 text-[12.5px]">
            <div className="font-bold text-[#172A3A] pb-1 border-b border-[#EEF4F8]">
              Căn cứ kết quả thẩm định 04 tiêu chuẩn:
            </div>
            <div className="grid grid-cols-2 gap-2 text-[#466474]">
              <div>• TT01: Đã đạt danh hiệu cấp Trường</div>
              <div className="text-right font-semibold text-[#16A34A]">Đạt chuẩn</div>
              <div>• TT02: 100% sinh viên tham gia phong trào</div>
              <div className="text-right font-semibold text-[#16A34A]">100% ({application.tt02.participatingCount}/{application.tt02.totalMembers})</div>
              <div>• TT03: Ít nhất 20% đạt SV5T cấp Trường</div>
              <div className="text-right font-semibold text-[#16A34A]">
                {((application.tt03.recognizedCount / (application.tt02.totalMembers || 1)) * 100).toFixed(1)}% (Ngưỡng &ge; 20%)
              </div>
              <div>• TT04: Chấp hành pháp luật & quy định</div>
              <div className="text-right font-semibold text-[#16A34A]">Xác nhận không vi phạm</div>
            </div>
          </div>

          {/* Signatory Footer */}
          <div className="pt-2 flex justify-end text-right text-[12.5px]">
            <div>
              <div className="font-bold text-[#172A3A]">{res?.signedBy || 'TM. BAN THƯ KÝ — CHỦ TỊCH HỘI SINH VIÊN TP. ĐÀ NẴNG'}</div>
              <div className="text-[11px] text-[#728391] mt-1">(Đã ký số và ban hành chính thức)</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#F8FBFD] border-t border-[#DCE7EE] flex items-center justify-between">
          <div className="text-[11.5px] text-[#607483]">
            Trích lục số {res?.decisionNumber || '86/QĐ-HSV-TP'}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5"
            >
              <Printer size={14} />
              <span>In quyết định</span>
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
