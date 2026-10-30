import React from 'react';
import { Award, FileText, Clock, Printer } from 'lucide-react';
import { Button } from '../../buttons/Button';
import { CollectiveApplication, COLLECTIVE_TYPE_LABELS } from '../../../staff/collectiveTypes';
import {
  calculateParticipationRate,
  calculateRecognitionRate,
} from '../../../entities/collective/collectiveCalculations';

export interface CollectiveResultsTabProps {
  currentApp: CollectiveApplication;
  onOpenResultModal: () => void;
}

export const CollectiveResultsTab: React.FC<CollectiveResultsTabProps> = ({
  currentApp,
  onOpenResultModal,
}) => {
  const { status, tt01, tt02, tt03, tt04 } = currentApp;
  const participationRate = calculateParticipationRate(tt02.participatingCount, tt02.totalMembers);
  const recognitionRate = calculateRecognitionRate(tt03.recognizedCount, tt02.totalMembers);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-5 animate-in fade-in duration-150">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE7EE] pb-3">
        <div>
          <div className="text-[12px] font-bold text-[#0D78AE] uppercase tracking-wide">
            Hội Sinh viên Việt Nam Đại học Đà Nẵng · Năm học {currentApp.academicYear}
          </div>
          <h2 className="text-[20px] font-extrabold text-[#172A3A] mt-0.5">
            KẾT QUẢ XÉT CHỌN TẬP THỂ SINH VIÊN 5 TỐT
          </h2>
        </div>
        <div className="text-[12px] text-[#607483] font-mono">
          Mã hồ sơ: <span className="text-[#0B64A0] font-bold">{currentApp.id}</span>
        </div>
      </div>

      {status === 'published' ? (
        currentApp.finalResult?.outcome === 'recognized' ? (
          /* Favorable Published Result (Section 38 & 54) */
          <div className="p-6 bg-white border border-[#C6EED5] rounded-[18px] shadow-sm space-y-4">
            <div className="flex items-start gap-3.5 text-[#16A34A]">
              <div className="w-12 h-12 rounded-[12px] bg-[#EDF9F1] border border-[#C6EED5] flex items-center justify-center shrink-0">
                <Award size={26} />
              </div>
              <div>
                <div className="text-[12px] font-bold uppercase tracking-wider text-[#15803D]">
                  KẾT QUẢ CHÍNH THỨC ĐÃ CÔNG BỐ
                </div>
                <h3 className="text-[20px] font-extrabold text-[#172A3A] mt-0.5">
                  CHÚC MỪNG TẬP THỂ ĐÃ ĐƯỢC CÔNG NHẬN
                </h3>
                <p className="text-[13.5px] text-[#4A6275] mt-0.5">
                  Danh hiệu: <strong className="text-[#15803D]">Tập thể Sinh viên 5 tốt cấp Đại học Đà Nẵng</strong>
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[12px] text-[13px] text-[#334E68] space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12.5px]">
                <div>
                  • Tập thể: <strong>{currentApp.collectiveName}</strong> ({COLLECTIVE_TYPE_LABELS[currentApp.collectiveType]})
                </div>
                <div>• Đơn vị: <strong>{currentApp.institutionName}</strong></div>
                <div>• Quyết định công nhận số: <strong>{currentApp.finalResult?.decisionNumber || '86/QĐ-HSV-ĐHĐN'}</strong></div>
                <div>• Ngày ban hành: <strong>{currentApp.finalResult?.decisionDate || '24/10/2026'}</strong></div>
                <div>• Cơ quan ban hành: <strong>Hội Sinh viên Việt Nam Đại học Đà Nẵng</strong></div>
                <div>
                  • Thời điểm công bố trên hệ thống: <strong>{currentApp.finalResult?.publishedAt ? new Date(currentApp.finalResult.publishedAt).toLocaleString('vi-VN') : '24/10/2026'}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button
                type="button"
                variant="primary"
                onClick={onOpenResultModal}
                className="gap-2"
              >
                <Printer size={15} />
                <span>Xem & In trích lục quyết định công nhận</span>
              </Button>
            </div>
          </div>
        ) : (
          /* Unfavorable Published Result (Section 38 & 58 — NO green badge!) */
          <div className="p-6 bg-white border border-[#DCE7EE] rounded-[18px] shadow-sm space-y-4">
            <div className="flex items-start gap-3.5 text-[#475569]">
              <div className="w-12 h-12 rounded-[12px] bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-center shrink-0 text-[#64748B]">
                <FileText size={26} />
              </div>
              <div>
                <div className="text-[12px] font-bold uppercase tracking-wider text-[#64748B]">
                  KẾT QUẢ CHÍNH THỨC ĐÃ CÔNG BỐ
                </div>
                <h3 className="text-[19px] font-extrabold text-[#1E293B] mt-0.5">
                  CHƯA ĐƯỢC CÔNG NHẬN TRONG ĐỢT XÉT NÀY
                </h3>
                <p className="text-[13px] text-[#64748B] mt-0.5">
                  Hồ sơ của tập thể <strong>{currentApp.collectiveName}</strong> chưa đáp ứng đủ 04 điều kiện để công nhận danh hiệu Tập thể Sinh viên 5 tốt cấp Đại học Đà Nẵng năm học {currentApp.academicYear}.
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-[12.5px] space-y-2 text-[#334155]">
              <div className="font-bold text-[#1E293B]">Chi tiết kết quả xét chọn:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>• Tên tập thể: <strong>{currentApp.collectiveName}</strong></div>
                <div>• Đơn vị: <strong>{currentApp.institutionName}</strong></div>
                <div>• Ngày thông báo kết quả: <strong>{currentApp.finalResult?.decisionDate || '24/10/2026'}</strong></div>
                <div>• Cơ quan thông báo: <strong>Hội đồng xét chọn — Hội Sinh viên Đại học Đà Nẵng</strong></div>
              </div>

              <div className="pt-2 border-t border-[#CBD5E1] space-y-1">
                <div className="font-semibold text-[#475569]">Tổng hợp 04 tiêu chuẩn:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[12px]">
                  <div>• TT01 (Cấp Trường): <span className={tt01.isRecognizedSchoolLevel ? 'text-[#16A34A] font-semibold' : 'text-[#DC2626] font-semibold'}>{tt01.isRecognizedSchoolLevel ? 'Đạt' : 'Chưa đạt'}</span></div>
                  <div>• TT02 (100% phong trào): <span className={participationRate === 100 ? 'text-[#16A34A] font-semibold' : 'text-[#DC2626] font-semibold'}>{participationRate}% ({participationRate === 100 ? 'Đạt' : 'Chưa đạt 100%'})</span></div>
                  <div>• TT03 (≥20% SV5T): <span className={recognitionRate >= 20 ? 'text-[#16A34A] font-semibold' : 'text-[#DC2626] font-semibold'}>{recognitionRate.toFixed(1)}% ({recognitionRate >= 20 ? 'Đạt' : 'Chưa đạt ≥20%'})</span></div>
                  <div>• TT04 (Không vi phạm): <span className={tt04.noViolationsConfirmed ? 'text-[#16A34A] font-semibold' : 'text-[#DC2626] font-semibold'}>{tt04.noViolationsConfirmed ? 'Đạt' : 'Chưa đạt'}</span></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button
                type="button"
                variant="secondary"
                onClick={onOpenResultModal}
                className="gap-2"
              >
                <FileText size={15} />
                <span>Xem thông báo kết quả chính thức</span>
              </Button>
            </div>
          </div>
        )
      ) : (
        /* Pre-publication State (Section 37 — NO leaked internal conclusions) */
        <div className="p-8 bg-white border border-[#DCE7EE] rounded-[18px] text-center space-y-3.5 shadow-2xs">
          <div className="w-14 h-14 rounded-full bg-[#EAF6FC] border border-[#CFE3F0] flex items-center justify-center mx-auto text-[#0D78AE]">
            <Clock size={28} />
          </div>
          <div>
            <h3 className="text-[17px] font-extrabold text-[#172A3A]">
              {status === 'finalized'
                ? 'Đang chờ công bố kết quả chính thức'
                : 'Hồ sơ đang trong quá trình xem xét của cấp Đại học Đà Nẵng'}
            </h3>
            <p className="text-[13px] text-[#607483] max-w-lg mx-auto mt-1 leading-relaxed">
              {status === 'finalized'
                ? 'Hội đồng xét chọn đã hoàn tất quy trình xem xét hồ sơ. Kết quả chính thức đang được chuẩn bị để công bố theo quyết định của Ban Thư ký Hội Sinh viên Đại học Đà Nẵng.'
                : status === 'committee_pending'
                ? 'Hồ sơ đã hoàn tất phần thẩm định của Cán bộ và đang được trình Hội đồng xét chọn cấp Đại học Đà Nẵng xem xét kết luận.'
                : 'Hồ sơ tập thể đang được xử lý theo quy trình xét chọn cấp Đại học Đà Nẵng. Khi có quyết định chính thức, kết quả sẽ được công bố và thông báo trực tiếp đến tài khoản này.'}
            </p>
          </div>
          <div className="pt-2 text-[12px] text-[#728391]">
            Trạng thái hiện tại: <span className="font-semibold text-[#172A3A]">{status === 'finalized' ? 'Đã hoàn tất kết luận · Chờ công bố' : status === 'committee_pending' ? 'Hội đồng đang xem xét' : status === 'city_review_completed' ? 'Đã hoàn tất thẩm định Cán bộ' : 'Đang xử lý'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
