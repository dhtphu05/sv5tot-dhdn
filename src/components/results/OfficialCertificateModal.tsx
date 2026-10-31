import React from 'react';
import { X, Download, Printer, Award, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import { HsvLogo } from '../brand/HsvLogo';
import { Button } from '../buttons/Button';
import { FinalResultData } from './resultTypes';

export interface OfficialCertificateModalProps {
  isOpen: boolean;
  mode: 'certificate' | 'decision';
  resultData: FinalResultData;
  onClose: () => void;
  onDownloadFeedback?: (message: string) => void;
}

/**
 * OfficialCertificateModal Component (Prompt 11 Sections 15, 19, 20, 34)
 * Provides a dignified, realistic institutional document viewer for:
 * 1) Giấy chứng nhận Sinh viên 5 tốt cấp Đại học Đà Nẵng (Electronic Certificate)
 * 2) Quyết định công bố kết quả xét chọn (Official Decision Document PDF preview)
 */
export const OfficialCertificateModal: React.FC<OfficialCertificateModalProps> = ({
  isOpen,
  mode,
  resultData,
  onClose,
  onDownloadFeedback,
}) => {
  if (!isOpen) return null;

  const isCertificate = mode === 'certificate';
  const docTitle = isCertificate
    ? 'Giấy chứng nhận Sinh viên 5 tốt cấp Đại học Đà Nẵng'
    : resultData.decisionDocument?.title ||
      'Quyết định công bố kết quả xét chọn Sinh viên 5 tốt cấp Đại học Đà Nẵng';
  const docFileName = isCertificate
    ? `Giay_chung_nhan_SV5T_DHDN_${resultData.student.studentId}.pdf`
    : resultData.decisionDocument?.fileName ||
      'Van_ban_cong_bo_ket_qua_SV5T_Da_Nang_2026_2027.pdf';

  const resolvedPublishedDateStr = (() => {
    const raw = (resultData.publishedAt || '').trim();
    if (!raw) return '24/10/2026';
    const dmy = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dmy) {
      return `${dmy[1].padStart(2, '0')}/${dmy[2].padStart(2, '0')}/${dmy[3]}`;
    }
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      const dd = String(parsed.getDate()).padStart(2, '0');
      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
      const yyyy = String(parsed.getFullYear());
      return `${dd}/${mm}/${yyyy}`;
    }
    return '24/10/2026';
  })();
  const [pubDay, pubMonth, pubYear] = resolvedPublishedDateStr.split('/');

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (onDownloadFeedback) {
      onDownloadFeedback(`Đã tải xuống ${docFileName}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0F1E2B]/65 backdrop-blur-[2px] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="official-doc-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[16px] border border-[#DCE7EE] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#F8FBFD] border-b border-[#DCE7EE] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-[10px] bg-[#EAF6FC] border border-[#C5E4F5] text-[#0D78AE] flex items-center justify-center shrink-0">
              {isCertificate ? <Award size={19} /> : <FileText size={19} />}
            </div>
            <div className="min-w-0">
              <h2
                id="official-doc-modal-title"
                className="text-[15.5px] font-bold text-[#172A3A] truncate"
              >
                {docTitle}
              </h2>
              <div className="flex items-center gap-2 text-[12px] text-[#607483] mt-0.5">
                <span className="font-mono text-[11.5px] text-[#466474] truncate">
                  {docFileName}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 text-[#136F3A] font-semibold">
                  <ShieldCheck size={13} />
                  Bản điện tử xác thực · {resultData.authority}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              iconLeading={<Printer size={14} />}
              onClick={handlePrint}
            >
              In bản lưu
            </Button>
            <Button
              variant="primary"
              size="sm"
              iconLeading={<Download size={14} />}
              onClick={handleDownload}
            >
              Tải bản PDF
            </Button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng cửa sổ"
              className="p-2 text-[#607483] hover:text-[#172A3A] hover:bg-[#EAF2F8] rounded-[8px] transition-colors cursor-pointer ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Document Preview Canvas */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#EBF2F7] flex justify-center">
          {isCertificate ? (
            /* ===================================================================== */
            /* CEREMONIAL CERTIFICATE PREVIEW (Giấy chứng nhận Sinh viên 5 tốt)      */
            /* ===================================================================== */
            <div className="w-full max-w-[760px] bg-[#FFFEFA] rounded-[8px] shadow-lg border-2 border-[#C8A962] p-3 sm:p-4 select-none">
              <div className="border border-[#DFC78C] p-6 sm:p-10 relative overflow-hidden">
                {/* Subtle corner ornaments */}
                <div className="w-6 h-6 border-t-2 border-l-2 border-[#B38F3B] absolute top-2.5 left-2.5" />
                <div className="w-6 h-6 border-t-2 border-r-2 border-[#B38F3B] absolute top-2.5 right-2.5" />
                <div className="w-6 h-6 border-b-2 border-l-2 border-[#B38F3B] absolute bottom-2.5 left-2.5" />
                <div className="w-6 h-6 border-b-2 border-r-2 border-[#B38F3B] absolute bottom-2.5 right-2.5" />

                {/* National & Organization Header */}
                <div className="text-center space-y-1">
                  <p className="text-[11.5px] font-bold tracking-wider text-[#466474] uppercase">
                    HỘI SINH VIÊN VIỆT NAM
                  </p>
                  <p className="text-[13px] font-extrabold tracking-wide text-[#126A9C] uppercase">
                    BAN CHẤP HÀNH HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG
                  </p>
                  <div className="flex justify-center pt-3 pb-1">
                    <HsvLogo size={46} />
                  </div>
                </div>

                {/* Certificate Main Title */}
                <div className="text-center mt-4 mb-6">
                  <p className="text-[12px] font-bold tracking-[0.2em] text-[#9A7420] uppercase">
                    BAN THƯ KÝ HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG
                  </p>
                  <h3 className="text-[28px] sm:text-[32px] font-extrabold tracking-tight text-[#126A9C] uppercase mt-1">
                    GIẤY CHỨNG NHẬN
                  </h3>
                  <div className="w-24 h-[2px] bg-[#C8A962] mx-auto mt-2" />
                </div>

                {/* Recipient Details */}
                <div className="text-center space-y-3 my-6">
                  <p className="text-[13px] text-[#466474] font-medium">
                    Chứng nhận sinh viên:
                  </p>
                  <p className="text-[24px] sm:text-[26px] font-extrabold text-[#172A3A] tracking-tight">
                    {resultData.student.fullName}
                  </p>
                  <div className="flex items-center justify-center gap-3 text-[13.5px] text-[#334E68] font-medium flex-wrap">
                    <span>
                      Mã số sinh viên:{' '}
                      <strong className="font-bold text-[#172A3A] tabular-nums">
                        {resultData.student.studentId}
                      </strong>
                    </span>
                    {resultData.student.class && (
                      <>
                        <span>·</span>
                        <span>
                          Lớp: <strong className="font-bold text-[#172A3A]">{resultData.student.class}</strong>
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-[14px] font-semibold text-[#172A3A] max-w-xl mx-auto leading-snug">
                    Đơn vị: {resultData.student.university}
                  </p>
                </div>

                {/* Award Title Block */}
                <div className="bg-[#F4FAFE] border border-[#CFE6F5] rounded-[10px] py-4 px-6 text-center max-w-xl mx-auto my-6">
                  <p className="text-[12px] font-bold uppercase tracking-wider text-[#0D78AE]">
                    ĐÃ ĐẠT DANH HIỆU
                  </p>
                  <p className="text-[20px] sm:text-[22px] font-extrabold text-[#126A9C] uppercase mt-1">
                    “{resultData.awardTitle}”
                  </p>
                  <p className="text-[13.5px] font-semibold text-[#334E68] mt-1">
                    Năm học {resultData.schoolYear}
                  </p>
                </div>

                {/* Footer & Issuing Authority */}
                <div className="mt-8 pt-4 border-t border-[#EAE3D2] flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 text-[12.5px]">
                  <div className="space-y-1 text-[#466474]">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EAFBF1] text-[#136F3A] font-bold text-[11.5px]">
                      <CheckCircle2 size={13} />
                      Đã xác thực trên Hệ thống 5TOT ĐHĐN
                    </div>
                    <p className="mt-2">
                      Mã hồ sơ công nhận:{' '}
                      <span className="font-mono font-semibold text-[#172A3A]">
                        {resultData.applicationSnapshot.applicationId}
                      </span>
                    </p>
                    {resultData.decisionNumber && (
                      <p>
                        Theo Quyết định số:{' '}
                        <span className="font-semibold text-[#172A3A]">
                          {resultData.decisionNumber}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="text-center sm:text-right ml-auto">
                    <p className="italic text-[#466474]">
                      Đà Nẵng, ngày {pubDay || '24'} tháng {pubMonth || '10'} năm{' '}
                      {pubYear || '2026'}
                    </p>
                    <p className="font-bold text-[#172A3A] uppercase mt-1">
                      TM. BAN THƯ KÝ HỘI SINH VIÊN ĐẠI HỌC ĐÀ NẴNG
                    </p>
                    <div className="my-3 inline-flex items-center justify-center px-3 py-1.5 rounded border border-dashed border-[#0D78AE]/40 bg-[#F0F9FF] text-[#0D78AE] text-[11.5px] font-bold">
                      Chữ ký số & Dấu xác nhận Hội Sinh viên Đại học Đà Nẵng
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ===================================================================== */
            /* OFFICIAL DECISION DOCUMENT PREVIEW (Văn bản công bố kết quả)          */
            /* ===================================================================== */
            <div className="w-full max-w-[760px] bg-white rounded-[8px] shadow-lg border border-[#DCE7EE] p-8 sm:p-10 text-[#172A3A] space-y-6">
              {/* Administrative Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center border-b border-[#E2E8F0] pb-5">
                <div className="space-y-1">
                  <p className="text-[12px] font-semibold uppercase text-[#466474]">
                    HỘI SINH VIÊN VIỆT NAM
                  </p>
                  <p className="text-[12.5px] font-bold uppercase text-[#172A3A]">
                    BCH HỘI SINH VIÊN ĐẠI HỌC ĐÀ NẴNG
                  </p>
                  <p className="text-[12px] text-[#466474] pt-1">
                    Số: {resultData.decisionNumber || '108/QĐ-HSV-ĐHĐN'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[12px] font-bold uppercase text-[#172A3A]">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </p>
                  <p className="text-[12.5px] font-bold text-[#172A3A]">
                    Độc lập - Tự do - Hạnh phúc
                  </p>
                  <p className="text-[12px] italic text-[#466474] pt-1">
                    Đà Nẵng, ngày {resolvedPublishedDateStr}
                  </p>
                </div>
              </div>

              {/* Document Title */}
              <div className="text-center space-y-1.5 pt-2">
                <h3 className="text-[18px] font-extrabold uppercase tracking-tight text-[#172A3A]">
                  QUYẾT ĐỊNH
                </h3>
                <p className="text-[14px] font-bold text-[#334E68] max-w-lg mx-auto leading-snug">
                  Về việc công nhận danh hiệu “{resultData.awardTitle}” năm học {resultData.schoolYear}
                </p>
              </div>

              {/* Excerpt Body */}
              <div className="space-y-3 text-[13.5px] text-[#334E68] leading-relaxed">
                <p className="font-bold text-center text-[#172A3A] uppercase">
                  BAN THƯ KÝ HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG
                </p>
                <p>
                  - Căn cứ Quy chế xét chọn danh hiệu “Sinh viên 5 tốt” cấp Đại học Đà Nẵng năm học{' '}
                  {resultData.schoolYear} của Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng;
                </p>
                <p>
                  - Căn cứ kết quả họp Hội đồng xét chọn danh hiệu “Sinh viên 5 tốt” cấp Đại học Đà Nẵng năm học{' '}
                  {resultData.schoolYear} và đề nghị của Văn phòng Hội Sinh viên Đại học Đà Nẵng;
                </p>
                <p className="font-bold text-[#172A3A] pt-1">QUYẾT ĐỊNH:</p>
                <p>
                  <strong>Điều 1.</strong> Công nhận danh hiệu{' '}
                  <strong>“{resultData.awardTitle}”</strong> năm học {resultData.schoolYear} cho các cá nhân đạt đủ 05 tiêu chí theo Quy chế (có danh sách trích ngang kèm theo).
                </p>
              </div>

              {/* Highlighted Student Entry in the Official Roster */}
              <div className="bg-[#F8FBFD] border border-[#CFE6F5] rounded-[10px] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#0D78AE]">
                    Trích lục danh sách công nhận tương ứng với hồ sơ của bạn
                  </span>
                  <span className="text-[11.5px] font-semibold text-[#136F3A] bg-[#EAFBF1] px-2 py-0.5 rounded">
                    Đạt 5/5 tiêu chí
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-[13px]">
                  <div>
                    <span className="text-[#607483] block text-[11.5px]">Họ và tên sinh viên</span>
                    <span className="font-bold text-[#172A3A]">{resultData.student.fullName}</span>
                  </div>
                  <div>
                    <span className="text-[#607483] block text-[11.5px]">Mã số sinh viên</span>
                    <span className="font-bold text-[#172A3A] tabular-nums">
                      {resultData.student.studentId}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#607483] block text-[11.5px]">Đơn vị đào tạo</span>
                    <span className="font-semibold text-[#172A3A]">
                      {resultData.student.university}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <div className="text-right space-y-1 text-[13px]">
                  <p className="font-bold uppercase text-[#172A3A]">
                    TM. BAN THƯ KÝ HỘI SINH VIÊN ĐẠI HỌC ĐÀ NẴNG
                  </p>
                  <p className="text-[12px] text-[#607483]">
                    (Đã ký và đóng dấu xác thực điện tử)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
