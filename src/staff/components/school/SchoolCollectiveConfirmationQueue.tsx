/**
 * 5TOT ĐHĐN — School Collective Confirmation Queue & Handover View
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt S4.8 v2 Sections 41–47:
 * - Queue for School Officers / Confirmers (e.g. Nguyễn Văn An, ĐH Đà Nẵng).
 * - Displays Collective applications submitted for institutional sign-off.
 * - Institutional sign-off means acknowledging responsibility and forwarding to City.
 * - NO detailed school-level granular review required for collective track!
 * - Two primary actions: [Trả về để chỉnh sửa] and [Xác nhận và chuyển cấp ĐHĐN].
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  CheckCircle2,
  Send,
  Info,
  Eye,
  Search,
  X,
} from 'lucide-react';
import {
  CollectiveApplication,
  COLLECTIVE_TYPE_LABELS,
} from '../../collectiveTypes';
import {
  getCollectiveApplicationsForSchoolReviewUnit,
  confirmAndForwardToCity,
  returnForCorrection,
  subscribeToCollectiveStore,
} from '../../collectiveStore';
import { StaffUser } from '../../types';
import { Button } from '../../../components/buttons/Button';
import { FileTypeIcon } from '../../../components/evidence/FileTypeIcon';

export interface SchoolCollectiveConfirmationQueueProps {
  currentUser: StaffUser;
}

export const SchoolCollectiveConfirmationQueue: React.FC<SchoolCollectiveConfirmationQueueProps> = ({
  currentUser,
}) => {
  const userUnitId = currentUser.schoolReviewUnitId || 'unit-dut';
  const unitName = currentUser.unitLabel || 'Trường Đại học Bách khoa – ĐHĐN';

  const [apps, setApps] = useState<CollectiveApplication[]>(() =>
    getCollectiveApplicationsForSchoolReviewUnit(userUnitId)
  );

  useEffect(() => {
    const unsubscribe = subscribeToCollectiveStore(() => {
      setApps(getCollectiveApplicationsForSchoolReviewUnit(userUnitId));
    });
    return unsubscribe;
  }, [userUnitId]);

  const [searchQuery, setSearchQuery] = useState('');
  const [tabFilter, setTabFilter] = useState<'pending' | 'forwarded' | 'returned' | 'all'>('pending');

  // Selected App for Sign-off Screen
  const [selectedApp, setSelectedApp] = useState<CollectiveApplication | null>(null);

  // Return for Correction Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState(
    'Vui lòng bổ sung Quyết định công nhận Sinh viên 5 tốt cấp Trường có mộc đỏ và danh sách chi tiết.'
  );

  // Confirm Forward Dialog State
  const [isForwardConfirmOpen, setIsForwardConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        app.collectiveName.toLowerCase().includes(q) ||
        app.institutionName.toLowerCase().includes(q) ||
        app.preparedByUserName.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (tabFilter === 'pending') {
        return app.status === 'submitted_for_unit_confirmation';
      }
      if (tabFilter === 'forwarded') {
        return (
          app.status === 'unit_confirmed_and_forwarded' ||
          app.status === 'city_unassigned' ||
          app.status === 'city_assigned' ||
          app.status === 'city_in_review' ||
          app.status === 'city_supplement_pending' ||
          app.status === 'city_supplement_returned' ||
          app.status === 'city_review_completed' ||
          app.status === 'committee_pending' ||
          app.status === 'finalized' ||
          app.status === 'published'
        );
      }
      if (tabFilter === 'returned') {
        return app.status === 'returned_for_correction';
      }
      return true;
    });
  }, [apps, searchQuery, tabFilter]);

  const handleReturnForCorrection = () => {
    if (!selectedApp || !returnReason.trim()) return;

    returnForCorrection(selectedApp.id, returnReason.trim(), {
      userId: currentUser.id,
      name: currentUser.fullName,
      role: currentUser.roleLabel,
    });

    setIsReturnModalOpen(false);
    setSelectedApp(null);
    showToast(`Đã trả hồ sơ ${selectedApp.collectiveName} về cho người lập để chỉnh sửa.`);
  };

  const handleConfirmAndForward = () => {
    if (!selectedApp) return;

    confirmAndForwardToCity(selectedApp.id, {
      userId: currentUser.id,
      name: currentUser.fullName,
      role: currentUser.roleLabel,
      unitId: userUnitId,
      unitName,
    });

    setIsForwardConfirmOpen(false);
    setSelectedApp(null);
    showToast(`Đã xác nhận và chuyển hồ sơ ${selectedApp.collectiveName} lên cấp Đại học Đà Nẵng thành công!`);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-[10px] bg-[#172A3A] text-white text-[13px] font-semibold shadow-xl flex items-center gap-2">
          <CheckCircle2 size={16} className="text-[#38BDF8]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-[16px] border border-[#DCE7EE] shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-wider text-[#0D78AE]">
              <Building2 size={15} />
              <span>GIÁM SÁT HỒ SƠ TẬP THỂ TRỰC THUỘC ĐƠN VỊ</span>
            </div>
            <h1 className="text-[20px] font-extrabold text-[#172A3A] tracking-tight mt-1">
              Danh sách Hồ sơ Tập thể trực thuộc đơn vị
            </h1>
            <p className="text-[12.5px] text-[#607483] mt-0.5">
              Đơn vị quản lý: <strong>{unitName}</strong> · Quy định 2025–2026: Hồ sơ tập thể nộp trực tiếp lên cấp Đại học Đà Nẵng để tiếp nhận và xét chọn
            </p>
          </div>

          <div className="flex items-center gap-2 text-[12px]">
            <span className="font-semibold text-[#607483]">Tổng số tập thể đơn vị:</span>
            <span className="font-extrabold text-[#0D78AE] bg-[#EAF6FC] px-2.5 py-1 rounded-[6px] border border-[#CFE3F0]">
              {apps.length} hồ sơ
            </span>
          </div>
        </div>

        {/* Regulatory Policy Clarification Notice */}
        <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[10px] flex items-start gap-2.5 text-[12.5px] text-[#166534]">
          <CheckCircle2 size={17} className="text-[#16A34A] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Quyết định nghiệp vụ chính thức: </strong>
            Hồ sơ Tập thể "Sinh viên 5 tốt" hiện nộp trực tiếp lên Hội Sinh viên Việt Nam Đại học Đà Nẵng, không qua khâu duyệt trung gian hoặc chuyển trường. Trang này phục vụ cán bộ nhà trường theo dõi tiến độ thẩm định của các Chi hội/LCH trực thuộc và tra cứu hồ sơ lịch sử.
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-[14px] border border-[#DCE7EE] shadow-2xs flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[260px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#728391]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên tập thể, đơn vị, người lập..."
            className="w-full h-[40px] pl-10 pr-4 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[9px] text-[13px] outline-none"
          />
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F1F5F9] rounded-[10px] text-[12.5px] font-semibold">
          <button
            type="button"
            onClick={() => setTabFilter('pending')}
            className={`px-3 py-1.5 rounded-[7px] transition-all cursor-pointer ${
              tabFilter === 'pending'
                ? 'bg-white text-[#0D78AE] shadow-xs font-bold'
                : 'text-[#607483] hover:text-[#172A3A]'
            }`}
          >
            Chờ xác nhận ({apps.filter((a) => a.status === 'submitted_for_unit_confirmation').length})
          </button>
          <button
            type="button"
            onClick={() => setTabFilter('forwarded')}
            className={`px-3 py-1.5 rounded-[7px] transition-all cursor-pointer ${
              tabFilter === 'forwarded'
                ? 'bg-white text-[#0D78AE] shadow-xs font-bold'
                : 'text-[#607483] hover:text-[#172A3A]'
            }`}
          >
            Đã chuyển cấp ĐHĐN ({apps.filter((a) => a.status !== 'draft' && a.status !== 'submitted_for_unit_confirmation' && a.status !== 'returned_for_correction').length})
          </button>
          <button
            type="button"
            onClick={() => setTabFilter('returned')}
            className={`px-3 py-1.5 rounded-[7px] transition-all cursor-pointer ${
              tabFilter === 'returned'
                ? 'bg-white text-[#0D78AE] shadow-xs font-bold'
                : 'text-[#607483] hover:text-[#172A3A]'
            }`}
          >
            Đã trả về ({apps.filter((a) => a.status === 'returned_for_correction').length})
          </button>
          <button
            type="button"
            onClick={() => setTabFilter('all')}
            className={`px-3 py-1.5 rounded-[7px] transition-all cursor-pointer ${
              tabFilter === 'all'
                ? 'bg-white text-[#0D78AE] shadow-xs font-bold'
                : 'text-[#607483] hover:text-[#172A3A]'
            }`}
          >
            Tất cả ({apps.length})
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-[14px] border border-[#DCE7EE] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px] border-collapse">
            <thead>
              <tr className="bg-[#EAF6FC] text-[#466474] font-semibold border-b border-[#DCE7EE]">
                <th className="py-3 px-4">Tên tập thể & Loại</th>
                <th className="py-3 px-4">Đơn vị trực thuộc</th>
                <th className="py-3 px-4">Người lập hồ sơ</th>
                <th className="py-3 px-4">Tham gia phong trào (TT02)</th>
                <th className="py-3 px-4">SV5T cấp Trường (TT03)</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF4F8]">
              {filteredApps.length > 0 ? (
                filteredApps.map((app) => {
                  const partRate =
                    app.tt02.totalMembers > 0
                      ? (app.tt02.participatingCount / app.tt02.totalMembers) * 100
                      : 0;
                  const recRate =
                    app.tt02.totalMembers > 0
                      ? (app.tt03.recognizedCount / app.tt02.totalMembers) * 100
                      : 0;

                  return (
                    <tr key={app.id} className="hover:bg-[#F8FBFD] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#172A3A] text-[13px]">{app.collectiveName}</div>
                        <div className="text-[11.5px] text-[#607483]">{COLLECTIVE_TYPE_LABELS[app.collectiveType]}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[#475569]">
                        <div>{app.facultyName || 'Khoa'}</div>
                        <div className="text-[11.5px] text-[#728391]">{app.institutionName}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[#475569]">
                        <div className="font-semibold text-[#172A3A]">{app.preparedByUserName}</div>
                        <div className="text-[11.5px] text-[#728391]">{app.contactPhone || app.preparedByUserEmail}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-semibold ${partRate === 100 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                          {partRate.toFixed(1)}% ({app.tt02.participatingCount}/{app.tt02.totalMembers})
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-semibold ${recRate >= 20 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                          {recRate.toFixed(1)}% ({app.tt03.recognizedCount}/{app.tt02.totalMembers})
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {app.status === 'submitted_for_unit_confirmation' ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FEF6EB] text-[#D97706] border border-[#FADDB6]">
                            Chờ xác nhận
                          </span>
                        ) : app.status === 'returned_for_correction' ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                            Đã trả về
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#EDF9F1] text-[#16A34A] border border-[#C6EED5]">
                            Đã chuyển cấp ĐHĐN
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          type="button"
                          variant={app.status === 'submitted_for_unit_confirmation' ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() => setSelectedApp(app)}
                          className="gap-1.5"
                        >
                          <Eye size={13} />
                          <span>{app.status === 'submitted_for_unit_confirmation' ? 'Xem & Xác nhận' : 'Chi tiết'}</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#607483]">
                    Không có hồ sơ tập thể nào trong hàng chờ này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Institutional Confirmation Screen Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs select-none">
          <div className="relative w-full max-w-3xl bg-white rounded-[18px] shadow-2xl border border-[#DCE7EE] overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-[#F8FBFD] border-b border-[#DCE7EE] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[8px] bg-[#EAF6FC] text-[#0D78AE] flex items-center justify-center">
                  <Building2 size={18} />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-[#172A3A]">
                    Xác nhận hồ sơ tập thể: {selectedApp.collectiveName}
                  </h2>
                  <p className="text-[12px] text-[#607483]">
                    {selectedApp.institutionName} · Người lập: {selectedApp.preparedByUserName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="p-1.5 rounded-[6px] text-[#728391] hover:text-[#172A3A] hover:bg-[#EEF4F8] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-[13px]">
              {/* Responsibility & Destination Notice */}
              <div className="p-3.5 bg-[#EAF6FC] border border-[#CFE3F0] rounded-[10px] text-[12px] text-[#0B64A0] flex items-start gap-2.5">
                <Info size={16} className="shrink-0 mt-0.5 text-[#0D78AE]" />
                <div>
                  <div className="font-bold">Quy chế xác nhận hồ sơ Tập thể:</div>
                  <p className="mt-0.5 text-[#334155]">
                    Đơn vị ({unitName}) xác nhận tính hợp lệ về danh tính tổ chức và đồng ý đề cử chuyển hồ sơ lên cấp Đại học Đà Nẵng.
                    <strong> Đơn vị KHÔNG thực hiện thêm một vòng xét sơ chi tiết từng tiêu chí trên hệ thống.</strong> Hội Sinh viên Đại học Đà Nẵng sẽ là cấp trực tiếp thẩm định 4 tiêu chuẩn.
                  </p>
                </div>
              </div>

              {/* 4 Conditions Summary */}
              <div className="border border-[#DCE7EE] rounded-[12px] divide-y divide-[#EEF4F8] overflow-hidden bg-white">
                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-[#172A3A]">TT01 — Đã đạt danh hiệu cấp Trường</div>
                    <div className="text-[12px] text-[#607483]">
                      Quyết định số: {selectedApp.tt01.decisionNumber || '—'} · Ngày cấp: {selectedApp.tt01.decisionDate || '—'}
                    </div>
                  </div>
                  <span className="font-semibold text-[#16A34A] bg-[#EDF9F1] px-2 py-0.5 rounded text-[11.5px]">
                    {selectedApp.tt01.evidenceFiles?.length || 0} minh chứng
                  </span>
                </div>

                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-[#172A3A]">TT02 — 100% sinh viên tham gia phong trào</div>
                    <div className="text-[12px] text-[#607483]">
                      Số lượng: {selectedApp.tt02.participatingCount} / {selectedApp.tt02.totalMembers} sinh viên (
                      {selectedApp.tt02.totalMembers > 0
                        ? ((selectedApp.tt02.participatingCount / selectedApp.tt02.totalMembers) * 100).toFixed(1)
                        : 0}
                      % / Ngưỡng: 100%)
                    </div>
                  </div>
                  <span className="font-semibold text-[#16A34A] bg-[#EDF9F1] px-2 py-0.5 rounded text-[11.5px]">
                    {selectedApp.tt02.evidenceFiles?.length || 0} minh chứng
                  </span>
                </div>

                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-[#172A3A]">TT03 — Ít nhất 20% đạt SV5T cấp Trường</div>
                    <div className="text-[12px] text-[#607483]">
                      Số lượng: {selectedApp.tt03.recognizedCount} / {selectedApp.tt02.totalMembers} sinh viên (
                      {selectedApp.tt02.totalMembers > 0
                        ? ((selectedApp.tt03.recognizedCount / selectedApp.tt02.totalMembers) * 100).toFixed(1)
                        : 0}
                      % / Ngưỡng &ge; 20%)
                    </div>
                  </div>
                  <span className="font-semibold text-[#16A34A] bg-[#EDF9F1] px-2 py-0.5 rounded text-[11.5px]">
                    {selectedApp.tt03.evidenceFiles?.length || 0} minh chứng
                  </span>
                </div>

                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-[#172A3A]">TT04 — Chấp hành pháp luật & các quy định</div>
                    <div className="text-[12px] text-[#607483]">
                      Xác nhận không vi phạm · Đơn vị: {selectedApp.tt04.confirmingUnitName || 'Khoa'}
                    </div>
                  </div>
                  <span className="font-semibold text-[#16A34A] bg-[#EDF9F1] px-2 py-0.5 rounded text-[11.5px]">
                    {selectedApp.tt04.evidenceFiles?.length || 0} minh chứng
                  </span>
                </div>
              </div>

              {/* Uploaded Evidence Documents */}
              <div className="space-y-2">
                <div className="font-bold text-[#172A3A] text-[12.5px]">
                  Tài liệu minh chứng đính kèm trong hồ sơ:
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {[
                    ...(selectedApp.tt01.evidenceFiles || []),
                    ...(selectedApp.tt02.evidenceFiles || []),
                    ...(selectedApp.tt03.evidenceFiles || []),
                    ...(selectedApp.tt04.evidenceFiles || []),
                  ].map((f) => (
                    <div
                      key={f.id}
                      className="p-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] flex items-center justify-between text-[12px]"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileTypeIcon fileName={f.name} fileType={f.fileType} size="sm" />
                        <span className="font-semibold text-[#172A3A] truncate">{f.name}</span>
                      </div>
                      <span className="text-[#728391] text-[11px] shrink-0">{f.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-[#F8FBFD] border-t border-[#DCE7EE] flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="quiet"
                onClick={() => setSelectedApp(null)}
              >
                Đóng
              </Button>

              {selectedApp.status === 'submitted_for_unit_confirmation' ? (
                <div className="flex items-center gap-2.5">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsReturnModalOpen(true)}
                    className="text-[#DC2626] border-[#FECACA] hover:bg-[#FEF2F2]"
                  >
                    Trả về để chỉnh sửa
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setIsForwardConfirmOpen(true)}
                    className="gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 size={15} />
                    <span>Xác nhận và chuyển cấp ĐHĐN</span>
                  </Button>
                </div>
              ) : (
                <div className="text-[12px] text-[#607483] font-semibold">
                  Hồ sơ đã được xử lý (Trạng thái: {selectedApp.status})
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Return for Correction Modal */}
      {isReturnModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs select-none">
          <div className="relative w-full max-w-lg bg-white rounded-[16px] shadow-2xl border border-[#DCE7EE] p-6 space-y-4">
            <h3 className="font-bold text-[16px] text-[#172A3A]">
              Trả hồ sơ về cho Người lập để chỉnh sửa
            </h3>
            <p className="text-[12.5px] text-[#607483]">
              Hồ sơ {selectedApp.collectiveName} sẽ được mở lại quyền chỉnh sửa để người lập hoàn thiện nội dung.
            </p>

            <div>
              <label className="block text-[12.5px] font-semibold text-[#172A3A] mb-1">
                Lý do yêu cầu chỉnh sửa (bắt buộc)
              </label>
              <textarea
                rows={3}
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Ví dụ: Vui lòng bổ sung quyết định khen thưởng có dấu mộc đỏ..."
                className="w-full p-3 bg-white border border-[#DCE7EE] rounded-[8px] text-[13px] outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#EEF4F8]">
              <Button type="button" variant="quiet" onClick={() => setIsReturnModalOpen(false)}>
                Hủy
              </Button>
              <Button type="button" variant="primary" onClick={handleReturnForCorrection} className="bg-[#DC2626] hover:bg-[#B91C1C]">
                Xác nhận trả về
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Forward Dialog */}
      {isForwardConfirmOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs select-none">
          <div className="relative w-full max-w-lg bg-white rounded-[16px] shadow-2xl border border-[#DCE7EE] p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-[#0D78AE]">
              <Send size={22} />
              <h3 className="font-bold text-[16px] text-[#172A3A]">
                Xác nhận chuyển hồ sơ tập thể lên cấp Đại học Đà Nẵng
              </h3>
            </div>

            <div className="text-[13px] space-y-2 text-[#334155]">
              <div>• Tên tập thể: <strong>{selectedApp.collectiveName}</strong></div>
              <div>• Đơn vị trực thuộc: <strong>{selectedApp.institutionName}</strong></div>
              <div>• Đơn vị xác nhận: <strong>{unitName}</strong></div>
              <div>• Điểm đến: <strong>Hội Sinh viên Việt Nam Đại học Đà Nẵng</strong></div>
            </div>

            <p className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] text-[12px] text-[#607483] leading-relaxed">
              Sau khi xác nhận, hồ sơ sẽ được chuyển đến cấp Đại học Đà Nẵng để xét chọn. Đơn vị không thực hiện thêm một vòng xét sơ chi tiết trên hệ thống.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#EEF4F8]">
              <Button type="button" variant="quiet" onClick={() => setIsForwardConfirmOpen(false)}>
                Quay lại
              </Button>
              <Button type="button" variant="primary" onClick={handleConfirmAndForward}>
                Xác nhận & Chuyển ngay →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
