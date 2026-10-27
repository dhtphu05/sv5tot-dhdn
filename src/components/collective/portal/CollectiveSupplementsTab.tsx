import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '../../buttons/Button';
import { CollectiveApplication } from '../../../staff/collectiveTypes';

export interface CollectiveSupplementsTabProps {
  currentApp: CollectiveApplication;
  onGoToApplication: () => void;
}

export const CollectiveSupplementsTab: React.FC<CollectiveSupplementsTabProps> = ({
  currentApp,
  onGoToApplication,
}) => {
  const supplementRequests = currentApp.supplementRequests || [];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-5 animate-in fade-in duration-150">
      <div>
        <h2 className="text-[20px] font-extrabold text-[#172A3A]">
          Yêu cầu bổ sung từ Cán bộ cấp Đại học Đà Nẵng
        </h2>
        <p className="text-[12.5px] text-[#607483] mt-0.5">
          Tương tác bổ sung trực tiếp với Cán bộ Hội Sinh viên Đại học Đà Nẵng phụ trách thẩm định
        </p>
      </div>

      {supplementRequests.length > 0 ? (
        <div className="space-y-4">
          {supplementRequests.map((supp) => (
            <div
              key={supp.id}
              className="p-5 bg-white border border-[#DCE7EE] rounded-[16px] shadow-2xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-[#FEF2F2] text-[#DC2626] font-bold text-[12px] rounded-full">
                    Tiêu chuẩn {supp.requirementId}
                  </span>
                  <span className="text-[12px] text-[#728391]">
                    Yêu cầu lúc: {supp.requestedAt} · Bởi: <strong>{supp.requestedByOfficerName}</strong>
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 font-bold text-[12px] rounded-full ${
                    supp.status === 'pending'
                      ? 'bg-[#FEF2F2] text-[#DC2626]'
                      : 'bg-[#EDF9F1] text-[#16A34A]'
                  }`}
                >
                  {supp.status === 'pending'
                    ? 'Chờ tập thể phản hồi'
                    : 'Đã gửi bổ sung'}
                </span>
              </div>

              <div className="p-3.5 bg-[#FEF6EB] border border-[#FADDB6] rounded-[10px] text-[13px] text-[#8C3A19] space-y-1">
                <div className="font-bold">Nội dung yêu cầu từ Cán bộ cấp Đại học Đà Nẵng:</div>
                <p>{supp.reason}</p>
                <div className="text-[11.5px] font-semibold text-[#B75B00] pt-1">
                  Hạn chót bổ sung: {supp.deadline}
                </div>
              </div>

              {supp.status === 'pending' ? (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={onGoToApplication}
                    className="gap-1.5"
                  >
                    <span>Thực hiện bổ sung ngay trong hồ sơ →</span>
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] text-[12px] text-[#607483]">
                  Tập thể đã gửi bổ sung lúc {supp.returnedAt || 'vừa xong'}. Cán bộ cấp Đại học Đà Nẵng đang thẩm định lại.
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white border border-[#DCE7EE] rounded-[16px] text-[#607483] space-y-2">
          <CheckCircle2 size={36} className="mx-auto text-[#16A34A]" />
          <div className="font-bold text-[14px] text-[#172A3A]">Không có yêu cầu bổ sung nào</div>
          <p className="text-[12.5px]">
            Hồ sơ của tập thể không có yêu cầu chỉnh sửa hoặc bổ sung minh chứng từ cấp Đại học Đà Nẵng.
          </p>
        </div>
      )}
    </div>
  );
};
