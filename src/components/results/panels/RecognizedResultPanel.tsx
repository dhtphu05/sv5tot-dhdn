import React from 'react';
import { Award, Check, Download, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { FinalResultData } from '../resultTypes';
import { Button } from '../../buttons/Button';
import { HsvLogo } from '../../brand/HsvLogo';

export interface RecognizedResultPanelProps {
  activeResult: FinalResultData;
  journeySteps: Array<{ label: string; date: string; state: string }>;
  onOpenDocModal: (mode: 'certificate' | 'decision') => void;
  onOpenApplication: () => void;
  onToast: (msg: string) => void;
}

export const RecognizedResultPanel: React.FC<RecognizedResultPanelProps> = ({
  activeResult,
  journeySteps,
  onOpenDocModal,
  onOpenApplication,
  onToast,
}) => {
  return (
    <section
      aria-label="Công nhận danh hiệu chính thức"
      className="bg-white rounded-[16px] border border-[#CFE3F0] shadow-elevated overflow-hidden"
    >
      {/* Institutional Top Accent Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#126A9C] via-[#18A6E0] to-[#1A934E]" />

      {/* Authority Subheader Bar */}
      <div className="px-6 py-3.5 bg-[#F8FBFD] border-b border-[#E3EDF5] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <HsvLogo size={32} />
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#126A9C]">
              HỘI SINH VIÊN VIỆT NAM THÀNH PHỐ ĐÀ NẴNG
            </p>
            <p className="text-[12px] text-[#466474] font-medium">
              Kết quả xét chọn chính thức · Năm học {activeResult.schoolYear}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-[12px] tabular-nums">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#EAFBF1] text-[#136F3A] font-bold border border-[#B6E6C9]">
            <ShieldCheck size={14} className="text-[#1A934E]" />
            Được công nhận chính thức
          </span>
          {activeResult.publishedAt && (
            <span className="text-[#466474] font-medium">
              Ngày công bố: <strong className="text-[#172A3A]">{activeResult.publishedAt}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Hero Outcome Body */}
      <div className="p-6 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Column: Formal Recognition Statement */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAFBF1] text-[#136F3A] text-[12px] font-bold">
              <Award size={15} className="text-[#1A934E]" />
              <span>DANH HIỆU THÀNH PHỐ</span>
            </div>

            <div>
              <p className="text-[13px] text-[#466474] font-medium">Chúc mừng sinh viên</p>
              <h1 className="text-[26px] sm:text-[30px] font-extrabold text-[#172A3A] tracking-tight leading-tight mt-0.5">
                {activeResult.student.fullName}
              </h1>
            </div>

            <div className="p-4 rounded-[12px] bg-[#F4F9FD] border border-[#DCEBF5] space-y-1.5 text-[13px]">
              <div className="text-[12px] uppercase font-bold tracking-wider text-[#0D78AE]">
                QUYẾT ĐỊNH CÔNG NHẬN
              </div>
              <p className="text-[#172A3A] font-bold text-[16px] leading-snug">
                Đạt danh hiệu {activeResult.awardTitle}
              </p>
              <p className="text-[#334E68] text-[12.5px] leading-relaxed">
                Hội đồng xét chọn Hội Sinh viên Đại học Đà Nẵng quyết định công nhận sau khi thẩm tra đầy đủ 5 tiêu chuẩn chuẩn tắc niên khóa {activeResult.schoolYear}.
              </p>
            </div>
          </div>

          {/* Student Metadata strip */}
          <div className="pt-2 border-t border-[#EEF4F8] grid grid-cols-2 sm:grid-cols-3 gap-3 text-[12.5px]">
            <div>
              <span className="text-[#607483] text-[11.5px] block">Mã số sinh viên</span>
              <span className="font-bold text-[#172A3A] font-mono">{activeResult.student.studentId}</span>
            </div>
            <div>
              <span className="text-[#607483] text-[11.5px] block">Khóa / Lớp</span>
              <span className="font-bold text-[#172A3A]">
                {activeResult.student.class || (activeResult.student as any).cohort || 'K2022'}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[#607483] text-[11.5px] block">Trường đại học</span>
              <span className="font-bold text-[#172A3A] truncate block" title={activeResult.student.university}>
                {activeResult.student.university}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Milestones Timeline + Action Cluster */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-5 bg-[#F8FBFD] p-5 rounded-[14px] border border-[#E3EDF5]">
          <div className="space-y-3">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#334E68]">
              Tiến trình thẩm định hồ sơ
            </h3>

            <div className="space-y-2">
              {journeySteps.map((step, idx) => (
                <div
                  key={step.label}
                  className="flex items-center justify-between text-[12.5px] py-1.5 px-2.5 rounded-[8px] bg-white border border-[#E3EDF5]"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${
                        idx === journeySteps.length - 1
                          ? 'bg-[#1A934E] ring-3 ring-[#1A934E]/15'
                          : 'bg-[#1A934E]'
                      }`}
                    >
                      <Check size={12} strokeWidth={2.8} />
                    </span>
                    <span className="font-semibold text-[#172A3A]">{step.label}</span>
                  </div>
                  <span className="text-[11.5px] font-medium text-[#466474] tabular-nums">
                    {step.date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Cluster */}
          <div className="pt-3 border-t border-[#E2ECF3] flex flex-col gap-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                variant="primary"
                size="md"
                iconLeading={<Award size={15} />}
                onClick={() => onOpenDocModal('certificate')}
                className="w-full justify-center font-bold"
              >
                Xem giấy chứng nhận
              </Button>
              <Button
                variant="secondary"
                size="md"
                iconTrailing={<ArrowRight size={15} />}
                onClick={onOpenApplication}
                className="w-full justify-center font-semibold"
              >
                Xem hồ sơ đã nộp
              </Button>
            </div>

            {activeResult.decisionDocument && (
              <button
                type="button"
                onClick={() => onOpenDocModal('decision')}
                className="w-full py-2 px-3 rounded-[8px] bg-white hover:bg-[#F0F8FD] border border-[#CFE3F0] text-[#0D78AE] text-[12.5px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText size={14} />
                <span>Xem văn bản công bố ({activeResult.decisionDocument.fileName})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
