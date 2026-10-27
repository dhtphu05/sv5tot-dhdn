/**
 * 5TOT ĐHĐN — School Supplement Queue Page (FSD Pages Layer)
 * Manages school-level supplement requests and student responses.
 */

import React from 'react';
import { ArrowRight, Inbox } from 'lucide-react';
import { StaffApplicationRecord } from '../../staff/types';
import { ApplicationReviewWorkspaceState } from '../../staff/reviewTypes';
import { Button } from '../../components/buttons/Button';

export interface SchoolSupplementsPageProps {
  unitName: string;
  schoolApps: StaffApplicationRecord[];
  schoolWorkspaces: Record<string, ApplicationReviewWorkspaceState>;
  supplementTab: 'all' | 'waiting' | 'returned' | 'completed';
  onSetSupplementTab: (tab: 'all' | 'waiting' | 'returned' | 'completed') => void;
  onOpenApplicationReview: (applicationId: string) => void;
}

export const SchoolSupplementsPage: React.FC<SchoolSupplementsPageProps> = ({
  unitName,
  schoolApps,
  schoolWorkspaces,
  supplementTab,
  onSetSupplementTab,
  onOpenApplicationReview,
}) => {
  const supplementItems = schoolApps.flatMap((app) => {
    const ws = schoolWorkspaces[app.applicationId];
    if (!ws) return [];
    return ws.supplementRequests.map((req) => ({
      request: req,
      application: app,
    }));
  });

  const waitingItems = supplementItems.filter(
    (i) => i.request.staffStatus === 'waiting_student'
  );
  const returnedItems = supplementItems.filter(
    (i) => i.request.staffStatus === 'student_returned'
  );
  const completedItems = supplementItems.filter(
    (i) =>
      i.request.staffStatus === 'resumed_review' ||
      i.request.staffStatus === 'closed' ||
      i.request.status === 'completed'
  );

  const activeList =
    supplementTab === 'waiting'
      ? waitingItems
      : supplementTab === 'returned'
      ? returnedItems
      : supplementTab === 'completed'
      ? completedItems
      : supplementItems;

  return (
    <div className="p-6 max-w-[1240px] w-full mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DCE7EE] pb-4">
        <div>
          <div className="text-[12px] font-semibold text-[#526B7C]">
            {unitName} · Xét sơ tuyển cấp Trường
          </div>
          <h1 className="text-[20px] font-extrabold text-[#0F2335] mt-0.5">
            Theo dõi yêu cầu bổ sung hồ sơ
          </h1>
          <p className="text-[13px] text-[#526B7C] mt-0.5">
            Quản lý các yêu cầu bổ sung minh chứng đã gửi tới sinh viên và tiếp nhận phản hồi bổ sung độc lập tại cấp Trường.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#DCE7EE]">
        <button
          type="button"
          onClick={() => onSetSupplementTab('returned')}
          className={`pb-2.5 px-3 text-[13px] font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
            supplementTab === 'returned'
              ? 'border-[#0D78AE] text-[#0D78AE]'
              : 'border-transparent text-[#526B7C] hover:text-[#172A3A]'
          }`}
        >
          <span>Sinh viên đã gửi bổ sung</span>
          <span className="px-2 py-0.5 text-[11px] rounded-full bg-[#EAF6FC] text-[#0B64A0] font-bold tabular-nums">
            {returnedItems.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSetSupplementTab('waiting')}
          className={`pb-2.5 px-3 text-[13px] font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
            supplementTab === 'waiting'
              ? 'border-[#0D78AE] text-[#0D78AE]'
              : 'border-transparent text-[#526B7C] hover:text-[#172A3A]'
          }`}
        >
          <span>Chờ sinh viên bổ sung</span>
          <span className="px-2 py-0.5 text-[11px] rounded-full bg-[#FEF6EB] text-[#B45309] font-bold tabular-nums">
            {waitingItems.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSetSupplementTab('completed')}
          className={`pb-2.5 px-3 text-[13px] font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
            supplementTab === 'completed'
              ? 'border-[#0D78AE] text-[#0D78AE]'
              : 'border-transparent text-[#526B7C] hover:text-[#172A3A]'
          }`}
        >
          <span>Đã xử lý / Đóng</span>
          <span className="px-2 py-0.5 text-[11px] rounded-full bg-[#EAFBF1] text-[#136F3A] font-bold tabular-nums">
            {completedItems.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSetSupplementTab('all')}
          className={`pb-2.5 px-3 text-[13px] font-bold border-b-2 cursor-pointer transition-colors ${
            supplementTab === 'all'
              ? 'border-[#0D78AE] text-[#0D78AE]'
              : 'border-transparent text-[#526B7C] hover:text-[#172A3A]'
          }`}
        >
          Tất cả ({supplementItems.length})
        </button>
      </div>

      {/* Supplement List */}
      {activeList.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-[#DCE7EE] p-12 text-center space-y-2">
          <Inbox size={32} className="mx-auto text-[#8EA1AF]" />
          <h3 className="font-bold text-[#172A3A]">
            Không có yêu cầu bổ sung nào
          </h3>
          <p className="text-[13px] text-[#526B7C]">
            Danh sách hiện không có mục nào ở trạng thái này.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[12px] border border-[#DCE7EE] divide-y divide-[#EEF4F8]">
          {activeList.map(({ request, application }) => (
            <div
              key={request.id}
              className="p-4 flex flex-wrap items-start justify-between gap-4 hover:bg-[#F9FCFE] transition-colors"
            >
              <div className="space-y-1.5 max-w-[700px]">
                <div className="flex items-center gap-2 text-[12px]">
                  <span className="font-bold text-[#0D78AE]">
                    {request.criterionName}
                  </span>
                  <span>·</span>
                  <span className="font-semibold text-[#172A3A]">
                    {request.declarationTitle || request.requirementTitle}
                  </span>
                  <span>·</span>
                  <span className="text-[#607483] tabular-nums">
                    Yêu cầu lúc: {request.requestedAt}
                  </span>
                </div>

                <div className="text-[13.5px] font-bold text-[#0F2335]">
                  {application.student.fullName} (MSSV:{' '}
                  {application.student.studentCode})
                  <span className="text-[12px] font-normal text-[#526B7C] ml-2">
                    · {application.institution.officialName}
                  </span>
                </div>

                <p className="text-[13px] text-[#4A6275] bg-[#F7FAFC] p-2.5 rounded-[8px] border border-[#E2EDF5]">
                  <span className="font-semibold text-[#172A3A]">
                    Nội dung yêu cầu:{' '}
                  </span>
                  {request.message}
                </p>

                <div className="flex items-center gap-3 text-[11.5px] text-[#607483]">
                  {request.deadline && (
                    <span className="text-[#B45309] font-medium">
                      Hạn chót: {request.deadline}
                    </span>
                  )}
                  <span>·</span>
                  <span>
                    Hành động cho phép:{' '}
                    {request.allowedActions.map((a) => (
                      <span
                        key={a}
                        className="font-semibold text-[#0B64A0] mr-1"
                      >
                        {a === 'addEvidence'
                          ? 'Bổ sung minh chứng'
                          : a === 'replaceEvidence'
                          ? 'Thay thế minh chứng'
                          : 'Cập nhật kê khai'}
                      </span>
                    ))}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <span
                  className={`px-2.5 py-1 text-[11.5px] font-bold rounded-[6px] border ${
                    request.staffStatus === 'student_returned'
                      ? 'bg-[#EAF6FC] text-[#0B64A0] border-[#CBE5F6]'
                      : request.staffStatus === 'waiting_student'
                      ? 'bg-[#FEF6EB] text-[#B45309] border-[#FADDB6]'
                      : 'bg-[#EAFBF1] text-[#136F3A] border-[#B6E6C9]'
                  }`}
                >
                  {request.staffStatus === 'student_returned'
                    ? 'Sinh viên đã gửi bổ sung'
                    : request.staffStatus === 'waiting_student'
                    ? 'Đang chờ sinh viên'
                    : 'Đã hoàn thành'}
                </span>

                <Button
                  variant="primary"
                  size="sm"
                  iconTrailing={<ArrowRight size={13} />}
                  onClick={() =>
                    onOpenApplicationReview(application.applicationId)
                  }
                >
                  Mở xét bổ sung
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
